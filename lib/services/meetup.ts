/**
 * Meetup Service
 * Handles safe meetup coordination between buyers and sellers
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8, 21.9, 21.10
 */

import { createClient } from "@/lib/supabase/server";

export interface SafeLocation {
  id: string;
  name: string;
  type: "police_station" | "bank" | "shopping_mall" | "public_space";
  address: string;
  latitude: number;
  longitude: number;
  distance_from_buyer?: number;
  distance_from_seller?: number;
}

export interface Meetup {
  id: string;
  transaction_id: string;
  buyer_id: string;
  seller_id: string;
  location_name: string;
  location_address: string;
  location_latitude: number;
  location_longitude: number;
  scheduled_time: Date;
  buyer_checked_in: boolean;
  seller_checked_in: boolean;
  buyer_checked_in_at?: Date;
  seller_checked_in_at?: Date;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  safety_tips_acknowledged: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MeetupScheduleData {
  transaction_id: string;
  buyer_id: string;
  seller_id: string;
  location_name: string;
  location_address: string;
  location_latitude: number;
  location_longitude: number;
  scheduled_time: Date;
}

export class MeetupService {
  /**
   * Get safe meetup location suggestions
   * Requirements: 21.1, 21.2
   */
  static async getSafeLocations(
    buyerLat: number,
    buyerLng: number,
    sellerLat: number,
    sellerLng: number,
    limit: number = 10,
  ): Promise<SafeLocation[]> {
    // In a real implementation, this would query a database of verified safe locations
    // For now, we'll return a curated list of common safe location types
    const safeLocations: SafeLocation[] = [
      // Police stations
      {
        id: "ps-1",
        name: "Lagos State Police Command",
        type: "police_station",
        address: "Ikeja, Lagos",
        latitude: 6.6018,
        longitude: 3.3515,
      },
      // Banks
      {
        id: "bank-1",
        name: "GTBank Ikeja Branch",
        type: "bank",
        address: "Allen Avenue, Ikeja, Lagos",
        latitude: 6.6033,
        longitude: 3.3566,
      },
      // Shopping malls
      {
        id: "mall-1",
        name: "Ikeja City Mall",
        type: "shopping_mall",
        address: "Obafemi Awolowo Way, Ikeja, Lagos",
        latitude: 6.6208,
        longitude: 3.3409,
      },
      {
        id: "mall-2",
        name: "The Palms Shopping Mall",
        type: "shopping_mall",
        address: "Lekki Phase 1, Lagos",
        latitude: 6.4474,
        longitude: 3.4701,
      },
    ];

    // Calculate distances from both parties
    const locationsWithDistances = safeLocations.map((location) => ({
      ...location,
      distance_from_buyer: this.calculateDistance(
        buyerLat,
        buyerLng,
        location.latitude,
        location.longitude,
      ),
      distance_from_seller: this.calculateDistance(
        sellerLat,
        sellerLng,
        location.latitude,
        location.longitude,
      ),
    }));

    // Sort by average distance from both parties
    locationsWithDistances.sort((a, b) => {
      const avgA =
        ((a.distance_from_buyer || 0) + (a.distance_from_seller || 0)) / 2;
      const avgB =
        ((b.distance_from_buyer || 0) + (b.distance_from_seller || 0)) / 2;
      return avgA - avgB;
    });

    return locationsWithDistances.slice(0, limit);
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Schedule a meetup
   * Requirements: 21.3, 21.6
   */
  static async scheduleMeetup(data: MeetupScheduleData): Promise<Meetup> {
    const supabase = await createClient();

    const { data: meetup, error } = await (supabase.from as any)("meetups")
      .insert({
        transaction_id: data.transaction_id,
        buyer_id: data.buyer_id,
        seller_id: data.seller_id,
        location_name: data.location_name,
        location_address: data.location_address,
        location_latitude: data.location_latitude,
        location_longitude: data.location_longitude,
        scheduled_time: data.scheduled_time.toISOString(),
        status: "scheduled",
        buyer_checked_in: false,
        seller_checked_in: false,
        safety_tips_acknowledged: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to schedule meetup: ${error.message}`);
    }

    // Send notifications to both parties (Requirements: 21.3)
    await this.sendMeetupNotifications(meetup.id, "scheduled");

    // Schedule reminder notifications (Requirements: 21.6)
    await this.scheduleReminders(meetup.id, data.scheduled_time);

    return {
      ...meetup,
      scheduled_time: new Date(meetup.scheduled_time),
      buyer_checked_in_at: meetup.buyer_checked_in_at
        ? new Date(meetup.buyer_checked_in_at)
        : undefined,
      seller_checked_in_at: meetup.seller_checked_in_at
        ? new Date(meetup.seller_checked_in_at)
        : undefined,
      created_at: new Date(meetup.created_at),
      updated_at: new Date(meetup.updated_at),
    };
  }

  /**
   * Check in to a meetup
   * Requirements: 21.5, 21.10
   */
  static async checkIn(
    meetupId: string,
    userId: string,
    userType: "buyer" | "seller",
  ): Promise<{ bothCheckedIn: boolean; meetup: Meetup }> {
    const supabase = await createClient();

    const checkInField =
      userType === "buyer" ? "buyer_checked_in" : "seller_checked_in";
    const checkInTimeField =
      userType === "buyer" ? "buyer_checked_in_at" : "seller_checked_in_at";

    const { data: meetup, error } = await (supabase.from as any)("meetups")
      .update({
        [checkInField]: true,
        [checkInTimeField]: new Date().toISOString(),
      })
      .eq("id", meetupId)
      .eq(`${userType}_id`, userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to check in: ${error.message}`);
    }

    const bothCheckedIn = meetup.buyer_checked_in && meetup.seller_checked_in;

    // If both parties checked in, prompt for transaction completion (Requirements: 21.10)
    if (bothCheckedIn) {
      await this.sendCompletionPrompt(meetup.id);
    }

    return {
      bothCheckedIn,
      meetup: {
        ...meetup,
        scheduled_time: new Date(meetup.scheduled_time),
        buyer_checked_in_at: meetup.buyer_checked_in_at
          ? new Date(meetup.buyer_checked_in_at)
          : undefined,
        seller_checked_in_at: meetup.seller_checked_in_at
          ? new Date(meetup.seller_checked_in_at)
          : undefined,
        created_at: new Date(meetup.created_at),
        updated_at: new Date(meetup.updated_at),
      },
    };
  }

  /**
   * Reschedule a meetup
   * Requirements: 21.7
   */
  static async rescheduleMeetup(
    meetupId: string,
    userId: string,
    newScheduledTime: Date,
  ): Promise<Meetup> {
    const supabase = await createClient();

    // Verify user is part of the meetup
    const { data: existingMeetup } = await (supabase.from as any)("meetups")
      .select("*")
      .eq("id", meetupId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .single();

    if (!existingMeetup) {
      throw new Error("Meetup not found or unauthorized");
    }

    const { data: meetup, error } = await (supabase.from as any)("meetups")
      .update({
        scheduled_time: newScheduledTime.toISOString(),
        status: "rescheduled",
        buyer_checked_in: false,
        seller_checked_in: false,
        buyer_checked_in_at: null,
        seller_checked_in_at: null,
      })
      .eq("id", meetupId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reschedule meetup: ${error.message}`);
    }

    // Notify both parties about reschedule
    await this.sendMeetupNotifications(meetup.id, "rescheduled");

    // Schedule new reminders
    await this.scheduleReminders(meetup.id, newScheduledTime);

    return {
      ...meetup,
      scheduled_time: new Date(meetup.scheduled_time),
      buyer_checked_in_at: meetup.buyer_checked_in_at
        ? new Date(meetup.buyer_checked_in_at)
        : undefined,
      seller_checked_in_at: meetup.seller_checked_in_at
        ? new Date(meetup.seller_checked_in_at)
        : undefined,
      created_at: new Date(meetup.created_at),
      updated_at: new Date(meetup.updated_at),
    };
  }

  /**
   * Cancel a meetup
   * Requirements: 21.7
   */
  static async cancelMeetup(meetupId: string, userId: string): Promise<void> {
    const supabase = await createClient();

    // Verify user is part of the meetup
    const { data: existingMeetup } = await (supabase.from as any)("meetups")
      .select("*")
      .eq("id", meetupId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .single();

    if (!existingMeetup) {
      throw new Error("Meetup not found or unauthorized");
    }

    const { error } = await (supabase.from as any)("meetups")
      .update({ status: "cancelled" })
      .eq("id", meetupId);

    if (error) {
      throw new Error(`Failed to cancel meetup: ${error.message}`);
    }

    // Notify both parties about cancellation
    await this.sendMeetupNotifications(meetupId, "cancelled");
  }

  /**
   * Report unsafe meetup experience
   * Requirements: 21.9
   */
  static async reportUnsafeMeetup(
    meetupId: string,
    reporterId: string,
    reason: string,
    details: string,
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await (supabase.from as any)("reports").insert({
      reporter_id: reporterId,
      report_type: "unsafe_meetup",
      related_id: meetupId,
      reason,
      details,
      status: "pending",
    });

    if (error) {
      throw new Error(`Failed to report unsafe meetup: ${error.message}`);
    }

    // Notify admin team
    await this.notifyAdminTeam(meetupId, reporterId, reason);
  }

  /**
   * Get meetup by ID
   */
  static async getMeetup(meetupId: string, userId: string): Promise<Meetup> {
    const supabase = await createClient();

    const { data: meetup, error } = await (supabase.from as any)("meetups")
      .select("*")
      .eq("id", meetupId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .single();

    if (error || !meetup) {
      throw new Error("Meetup not found or unauthorized");
    }

    return {
      ...meetup,
      scheduled_time: new Date(meetup.scheduled_time),
      buyer_checked_in_at: meetup.buyer_checked_in_at
        ? new Date(meetup.buyer_checked_in_at)
        : undefined,
      seller_checked_in_at: meetup.seller_checked_in_at
        ? new Date(meetup.seller_checked_in_at)
        : undefined,
      created_at: new Date(meetup.created_at),
      updated_at: new Date(meetup.updated_at),
    };
  }

  /**
   * Get safety tips
   * Requirements: 21.8
   */
  static getSafetyTips(): string[] {
    return [
      "Always meet in a public, well-lit location during daylight hours",
      "Bring a friend or family member with you to the meetup",
      "Share your live location with a trusted contact during the meetup",
      "Inspect the item thoroughly before completing the transaction",
      "Never share personal banking details or passwords",
      "Trust your instincts - if something feels wrong, leave immediately",
      "Use the platform's escrow payment system for added protection",
      "Verify the seller's identity and check their ratings before meeting",
      "Keep all communication within the platform for your safety",
      "Report any suspicious behavior to our support team immediately",
    ];
  }

  /**
   * Acknowledge safety tips
   * Requirements: 21.8
   */
  static async acknowledgeSafetyTips(
    meetupId: string,
    userId: string,
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await (supabase.from as any)("meetups")
      .update({ safety_tips_acknowledged: true })
      .eq("id", meetupId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (error) {
      throw new Error(`Failed to acknowledge safety tips: ${error.message}`);
    }
  }

  /**
   * Send meetup notifications
   * Requirements: 21.3, 21.7
   */
  private static async sendMeetupNotifications(
    meetupId: string,
    type: "scheduled" | "rescheduled" | "cancelled",
  ): Promise<void> {
    const supabase = await createClient();

    const { data: meetup } = await (supabase.from as any)("meetups")
      .select("*")
      .eq("id", meetupId)
      .single();

    if (!meetup) return;

    const messages = {
      scheduled: `Meetup scheduled at ${meetup.location_name} on ${new Date(meetup.scheduled_time).toLocaleString()}`,
      rescheduled: `Meetup rescheduled to ${new Date(meetup.scheduled_time).toLocaleString()}`,
      cancelled: "Meetup has been cancelled",
    };

    // Send to buyer
    await (supabase.from as any)("notifications").insert({
      user_id: meetup.buyer_id,
      type: "meetup_update",
      title: `Meetup ${type}`,
      message: messages[type],
      related_id: meetupId,
    });

    // Send to seller
    await (supabase.from as any)("notifications").insert({
      user_id: meetup.seller_id,
      type: "meetup_update",
      title: `Meetup ${type}`,
      message: messages[type],
      related_id: meetupId,
    });
  }

  /**
   * Schedule reminder notifications
   * Requirements: 21.6
   */
  private static async scheduleReminders(
    meetupId: string,
    scheduledTime: Date,
  ): Promise<void> {
    // In a real implementation, this would use a job queue or cron system
    // For now, we'll just log that reminders should be scheduled
    const oneHourBefore = new Date(scheduledTime.getTime() - 60 * 60 * 1000);
    const fifteenMinsBefore = new Date(
      scheduledTime.getTime() - 15 * 60 * 1000,
    );

    console.log(
      `Schedule reminder for meetup ${meetupId} at ${oneHourBefore} and ${fifteenMinsBefore}`,
    );

    // TODO: Implement actual job scheduling
  }

  /**
   * Send completion prompt
   * Requirements: 21.10
   */
  private static async sendCompletionPrompt(meetupId: string): Promise<void> {
    const supabase = await createClient();

    const { data: meetup } = await (supabase.from as any)("meetups")
      .select("*")
      .eq("id", meetupId)
      .single();

    if (!meetup) return;

    // Send to both parties
    await (supabase.from as any)("notifications").insert([
      {
        user_id: meetup.buyer_id,
        type: "transaction_completion",
        title: "Complete your transaction",
        message:
          "Both parties have checked in. Please confirm transaction completion.",
        related_id: meetupId,
      },
      {
        user_id: meetup.seller_id,
        type: "transaction_completion",
        title: "Complete your transaction",
        message:
          "Both parties have checked in. Please confirm transaction completion.",
        related_id: meetupId,
      },
    ]);
  }

  /**
   * Notify admin team about unsafe meetup report
   * Requirements: 21.9
   */
  private static async notifyAdminTeam(
    meetupId: string,
    reporterId: string,
    reason: string,
  ): Promise<void> {
    // In a real implementation, this would send notifications to admin users
    console.log(
      `Admin notification: Unsafe meetup reported for ${meetupId} by ${reporterId}. Reason: ${reason}`,
    );
    // TODO: Implement actual admin notification system
  }
}
