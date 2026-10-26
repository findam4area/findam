/**
 * Product Q&A Service
 * Requirements: 23.1-23.10
 */

import { createClient } from "@/lib/supabase/server";

export interface ProductQuestion {
  id: string;
  listing_id: string;
  asker_id: string;
  asker_name?: string;
  asker_avatar?: string;
  question: string;
  answer: string | null;
  answered_by: string | null;
  answerer_name?: string;
  answerer_avatar?: string;
  answered_at: Date | null;
  is_seller_answer: boolean;
  upvotes: number;
  status: "pending" | "answered" | "hidden";
  has_upvoted?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PostQuestionParams {
  listingId: string;
  userId: string;
  question: string;
}

export interface PostAnswerParams {
  questionId: string;
  userId: string;
  answer: string;
}

export class ProductQAService {
  /**
   * Get questions for a listing
   * Requirements: 23.1, 23.8
   */
  static async getQuestions(
    listingId: string,
    userId?: string,
  ): Promise<ProductQuestion[]> {
    const supabase = await createClient();

    const { data: questions, error } = await (supabase.from as any)(
      "product_questions",
    )
      .select(
        `
        *,
        asker:users!asker_id(full_name, avatar_url),
        answerer:users!answered_by(full_name, avatar_url)
      `,
      )
      .eq("listing_id", listingId)
      .neq("status", "hidden")
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    // Check which questions the user has upvoted
    let upvotedQuestionIds: string[] = [];
    if (userId) {
      const { data: upvotes } = await (supabase.from as any)("question_upvotes")
        .select("question_id")
        .eq("user_id", userId)
        .in(
          "question_id",
          questions.map((q: any) => q.id),
        );

      upvotedQuestionIds = (upvotes || []).map((u: any) => u.question_id);
    }

    return (questions || []).map((q: any) => ({
      id: q.id,
      listing_id: q.listing_id,
      asker_id: q.asker_id,
      asker_name: q.asker?.full_name,
      asker_avatar: q.asker?.avatar_url,
      question: q.question,
      answer: q.answer,
      answered_by: q.answered_by,
      answerer_name: q.answerer?.full_name,
      answerer_avatar: q.answerer?.avatar_url,
      answered_at: q.answered_at ? new Date(q.answered_at) : null,
      is_seller_answer: q.is_seller_answer,
      upvotes: q.upvotes,
      status: q.status,
      has_upvoted: upvotedQuestionIds.includes(q.id),
      created_at: new Date(q.created_at),
      updated_at: new Date(q.updated_at),
    }));
  }

  /**
   * Post a question
   * Requirements: 23.2, 23.3, 23.9
   */
  static async postQuestion(
    params: PostQuestionParams,
  ): Promise<ProductQuestion> {
    const supabase = await createClient();

    // Insert question (trigger will enforce 5 question limit)
    const { data: question, error } = await (supabase.from as any)(
      "product_questions",
    )
      .insert({
        listing_id: params.listingId,
        asker_id: params.userId,
        question: params.question,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("maximum of 5 questions")) {
        throw new Error(
          "You have reached the maximum of 5 questions per listing",
        );
      }
      throw new Error(`Failed to post question: ${error.message}`);
    }

    // Get listing details to notify seller
    const { data: listing } = await (supabase.from as any)("listings")
      .select("user_id, title")
      .eq("id", params.listingId)
      .single();

    if (listing) {
      // Send notification to seller
      await (supabase.from as any)("notifications").insert({
        user_id: listing.user_id,
        type: "question_posted",
        title: "New Question on Your Listing",
        message: `Someone asked: "${params.question.substring(0, 100)}${params.question.length > 100 ? "..." : ""}"`,
        link: `/listing/${params.listingId}`,
        metadata: {
          listing_id: params.listingId,
          question_id: question.id,
        },
      });
    }

    return {
      id: question.id,
      listing_id: question.listing_id,
      asker_id: question.asker_id,
      question: question.question,
      answer: question.answer,
      answered_by: question.answered_by,
      answered_at: question.answered_at ? new Date(question.answered_at) : null,
      is_seller_answer: question.is_seller_answer,
      upvotes: question.upvotes,
      status: question.status,
      created_at: new Date(question.created_at),
      updated_at: new Date(question.updated_at),
    };
  }

  /**
   * Post an answer
   * Requirements: 23.4, 23.5, 23.6
   */
  static async postAnswer(params: PostAnswerParams): Promise<void> {
    const supabase = await createClient();

    // Get question details
    const { data: question } = await (supabase.from as any)("product_questions")
      .select("listing_id, asker_id")
      .eq("id", params.questionId)
      .single();

    if (!question) {
      throw new Error("Question not found");
    }

    // Check if user is the seller
    const { data: listing } = await (supabase.from as any)("listings")
      .select("user_id")
      .eq("id", question.listing_id)
      .single();

    const isSellerAnswer = listing?.user_id === params.userId;

    // Update question with answer
    const { error } = await (supabase.from as any)("product_questions")
      .update({
        answer: params.answer,
        answered_by: params.userId,
        answered_at: new Date().toISOString(),
        is_seller_answer: isSellerAnswer,
        status: "answered",
      })
      .eq("id", params.questionId);

    if (error) {
      throw new Error(`Failed to post answer: ${error.message}`);
    }

    // Notify the question asker
    await (supabase.from as any)("notifications").insert({
      user_id: question.asker_id,
      type: "question_answered",
      title: isSellerAnswer
        ? "Seller Answered Your Question"
        : "Your Question Was Answered",
      message: `Answer: "${params.answer.substring(0, 100)}${params.answer.length > 100 ? "..." : ""}"`,
      link: `/listing/${question.listing_id}`,
      metadata: {
        listing_id: question.listing_id,
        question_id: params.questionId,
      },
    });
  }

  /**
   * Upvote a question
   * Requirements: 23.7
   */
  static async upvoteQuestion(
    questionId: string,
    userId: string,
  ): Promise<void> {
    const supabase = await createClient();

    // Check if already upvoted
    const { data: existing } = await (supabase.from as any)("question_upvotes")
      .select("id")
      .eq("question_id", questionId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Remove upvote
      await (supabase.from as any)("question_upvotes")
        .delete()
        .eq("question_id", questionId)
        .eq("user_id", userId);
    } else {
      // Add upvote
      await (supabase.from as any)("question_upvotes").insert({
        question_id: questionId,
        user_id: userId,
      });
    }
  }

  /**
   * Get seller answer rate
   * Requirements: 23.10
   */
  static async getSellerAnswerRate(sellerId: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await (supabase.rpc as any)(
      "get_seller_answer_rate",
      {
        seller_id: sellerId,
      },
    );

    if (error) {
      console.error("Failed to get seller answer rate:", error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Get user's question count for a listing
   * Requirements: 23.9
   */
  static async getUserQuestionCount(
    listingId: string,
    userId: string,
  ): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await (supabase.from as any)("product_questions")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listingId)
      .eq("asker_id", userId);

    if (error) {
      console.error("Failed to get question count:", error);
      return 0;
    }

    return count || 0;
  }
}
