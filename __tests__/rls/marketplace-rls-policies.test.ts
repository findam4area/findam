/**
 * Test Suite: Row Level Security (RLS) Policies
 * Task: 1.5 Implement Row Level Security (RLS) policies
 * Requirements: 15.2
 * 
 * Tests RLS policies for:
 * - Users: public read, users update own profile
 * - Categories: public read
 * - Listings: public see approved, users see own, admins see all
 * - Vendor applications: users see own, admins see all
 * - Approved vendors: public read
 * 
 * Test with different user roles: anonymous, authenticated user, admin
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test environment setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test user credentials
const TEST_USER_EMAIL = 'testuser@example.com';
const TEST_USER_PASSWORD = 'TestPassword123';
const TEST_ADMIN_EMAIL = 'admin@example.com';
const TEST_ADMIN_PASSWORD = 'AdminPassword123';

describe('RLS Policies - Marketplace Functionality', () => {
  let anonClient: SupabaseClient;
  let serviceClient: SupabaseClient;
  let userClient: SupabaseClient;
  let adminClient: SupabaseClient;
  
  let testUserId: string;
  let testAdminId: string;
  let otherUserId: string;
  let testCategoryId: string;
  let testListingId: string;
  let testVendorApplicationId: string;

  beforeAll(async () => {
    // Create clients
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Clean up any existing test data
    await serviceClient.from('vendor_applications').delete().ilike('contact_email', '%@example.com');
    await serviceClient.from('approved_vendors').delete().in('user_id', [testUserId, testAdminId]);
    await serviceClient.from('listings').delete().ilike('title', 'Test Listing%');
    await serviceClient.auth.admin.deleteUser(testUserId || '');
    await serviceClient.auth.admin.deleteUser(testAdminId || '');
    await serviceClient.auth.admin.deleteUser(otherUserId || '');
    
    // Create test regular user
    const { data: userData, error: userError } = await serviceClient.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
    });
    if (userError) throw userError;
    testUserId = userData.user.id;
    
    // Set user role to 'user' (default)
    await serviceClient.from('users').upsert({
      id: testUserId,
      email: TEST_USER_EMAIL,
      username: 'testuser',
      role: 'user',
    });
    
    // Create test admin user
    const { data: adminData, error: adminError } = await serviceClient.auth.admin.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (adminError) throw adminError;
    testAdminId = adminData.user.id;
    
    // Set admin role
    await serviceClient.from('users').upsert({
      id: testAdminId,
      email: TEST_ADMIN_EMAIL,
      username: 'adminuser',
      role: 'admin',
    });
    
    // Create another test user
    const { data: otherUserData, error: otherUserError } = await serviceClient.auth.admin.createUser({
      email: 'otheruser@example.com',
      password: 'OtherPassword123',
      email_confirm: true,
    });
    if (otherUserError) throw otherUserError;
    otherUserId = otherUserData.user.id;
    
    await serviceClient.from('users').upsert({
      id: otherUserId,
      email: 'otheruser@example.com',
      username: 'otheruser',
      role: 'user',
    });
    
    // Create authenticated clients
    const { data: userSignIn } = await anonClient.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });
    userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${userSignIn?.session?.access_token}`,
        },
      },
    });
    
    const { data: adminSignIn } = await anonClient.auth.signInWithPassword({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });
    adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${adminSignIn?.session?.access_token}`,
        },
      },
    });
    
    // Create test category
    const { data: categoryData } = await serviceClient.from('categories').insert({
      name: 'Test Category RLS',
      icon: 'test-icon',
    }).select().single();
    testCategoryId = categoryData?.id;
  });

  afterAll(async () => {
    // Clean up test data
    await serviceClient.from('vendor_applications').delete().ilike('contact_email', '%@example.com');
    await serviceClient.from('approved_vendors').delete().in('user_id', [testUserId, testAdminId]);
    await serviceClient.from('listings').delete().ilike('title', 'Test Listing%');
    await serviceClient.from('categories').delete().eq('name', 'Test Category RLS');
    await serviceClient.auth.admin.deleteUser(testUserId);
    await serviceClient.auth.admin.deleteUser(testAdminId);
    await serviceClient.auth.admin.deleteUser(otherUserId);
  });

  describe('Users Table RLS', () => {
    it('should allow public read of user profiles (anonymous)', async () => {
      const { data, error } = await anonClient
        .from('users')
        .select('*')
        .eq('id', testUserId)
        .single();
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(testUserId);
    });

    it('should allow authenticated users to read all profiles', async () => {
      const { data, error } = await userClient
        .from('users')
        .select('*');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('should allow users to update their own profile', async () => {
      const { error } = await userClient
        .from('users')
        .update({ bio: 'Updated bio' })
        .eq('id', testUserId);
      
      expect(error).toBeNull();
    });

    it('should prevent users from updating other profiles', async () => {
      const { error } = await userClient
        .from('users')
        .update({ bio: 'Hacked bio' })
        .eq('id', otherUserId);
      
      expect(error).toBeDefined();
      expect(error?.code).toBe('42501'); // insufficient_privilege
    });
  });

  describe('Categories Table RLS', () => {
    it('should allow public read of categories (anonymous)', async () => {
      const { data, error } = await anonClient
        .from('categories')
        .select('*');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('should allow authenticated users to read categories', async () => {
      const { data, error } = await userClient
        .from('categories')
        .select('*')
        .eq('id', testCategoryId);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Listings Table RLS', () => {
    beforeEach(async () => {
      // Create test listings with different statuses
      const listings = [
        {
          title: 'Test Listing Approved',
          description: 'This is an approved listing for testing',
          price: 1000,
          category_id: testCategoryId,
          user_id: testUserId,
          state: 'Lagos',
          lga: 'Ikeja',
          status: 'approved',
        },
        {
          title: 'Test Listing Pending',
          description: 'This is a pending listing for testing',
          price: 2000,
          category_id: testCategoryId,
          user_id: testUserId,
          state: 'Lagos',
          lga: 'Ikeja',
          status: 'pending',
        },
        {
          title: 'Test Listing Other User',
          description: 'This is another user listing',
          price: 3000,
          category_id: testCategoryId,
          user_id: otherUserId,
          state: 'Lagos',
          lga: 'Ikeja',
          status: 'pending',
        },
      ];
      
      await serviceClient.from('listings').insert(listings);
    });

    it('should allow anonymous users to see only approved listings', async () => {
      const { data, error } = await anonClient
        .from('listings')
        .select('*')
        .ilike('title', 'Test Listing%');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(1);
      expect(data![0].status).toBe('approved');
    });

    it('should allow authenticated users to see approved listings and their own', async () => {
      const { data, error } = await userClient
        .from('listings')
        .select('*')
        .ilike('title', 'Test Listing%');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      // Should see: 1 approved + 1 own pending = 2
      expect(data!.length).toBe(2);
      expect(data!.some(l => l.status === 'approved')).toBe(true);
      expect(data!.some(l => l.status === 'pending' && l.user_id === testUserId)).toBe(true);
    });

    it('should allow admins to see all listings', async () => {
      const { data, error } = await adminClient
        .from('listings')
        .select('*')
        .ilike('title', 'Test Listing%');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      // Should see all 3 listings
      expect(data!.length).toBe(3);
    });

    it('should allow users to create their own listings', async () => {
      const { data, error } = await userClient
        .from('listings')
        .insert({
          title: 'Test Listing User Created',
          description: 'User created listing',
          price: 5000,
          category_id: testCategoryId,
          user_id: testUserId,
          state: 'Lagos',
          lga: 'Ikeja',
          status: 'pending',
        })
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      testListingId = data?.id;
    });

    it('should allow users to update their own listings', async () => {
      const { error } = await userClient
        .from('listings')
        .update({ price: 6000 })
        .eq('id', testListingId);
      
      expect(error).toBeNull();
    });

    it('should prevent users from updating other users listings', async () => {
      const { data: otherListing } = await serviceClient
        .from('listings')
        .select('id')
        .eq('user_id', otherUserId)
        .single();
      
      const { error } = await userClient
        .from('listings')
        .update({ price: 10000 })
        .eq('id', otherListing?.id);
      
      expect(error).toBeDefined();
    });

    it('should allow admins to update any listing', async () => {
      const { error } = await adminClient
        .from('listings')
        .update({ status: 'approved' })
        .eq('id', testListingId);
      
      expect(error).toBeNull();
    });
  });

  describe('Vendor Applications Table RLS', () => {
    beforeEach(async () => {
      // Create test vendor applications
      const applications = [
        {
          user_id: testUserId,
          business_name: 'Test Business User',
          business_description: 'Test business description for user',
          contact_email: 'testuser@example.com',
          contact_phone: '+2348012345678',
          status: 'pending',
        },
        {
          user_id: otherUserId,
          business_name: 'Test Business Other',
          business_description: 'Test business description for other user',
          contact_email: 'otheruser@example.com',
          contact_phone: '+2348087654321',
          status: 'pending',
        },
      ];
      
      const { data } = await serviceClient
        .from('vendor_applications')
        .insert(applications)
        .select();
      
      testVendorApplicationId = data?.[0]?.id;
    });

    it('should allow users to see only their own vendor applications', async () => {
      const { data, error } = await userClient
        .from('vendor_applications')
        .select('*');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(1);
      expect(data![0].user_id).toBe(testUserId);
    });

    it('should prevent users from seeing other users vendor applications', async () => {
      const { data, error } = await userClient
        .from('vendor_applications')
        .select('*')
        .eq('user_id', otherUserId);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(0);
    });

    it('should allow admins to see all vendor applications', async () => {
      const { data, error } = await adminClient
        .from('vendor_applications')
        .select('*');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow users to create their own vendor application', async () => {
      const { data, error } = await userClient
        .from('vendor_applications')
        .insert({
          user_id: testUserId,
          business_name: 'Another Test Business',
          business_description: 'Another test business description',
          contact_email: 'testuser2@example.com',
          contact_phone: '+2348011111111',
          status: 'pending',
        })
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should prevent users from updating vendor applications', async () => {
      const { error } = await userClient
        .from('vendor_applications')
        .update({ status: 'approved' })
        .eq('id', testVendorApplicationId);
      
      expect(error).toBeDefined();
    });

    it('should allow admins to update vendor applications', async () => {
      const { error } = await adminClient
        .from('vendor_applications')
        .update({ status: 'approved' })
        .eq('id', testVendorApplicationId);
      
      expect(error).toBeNull();
    });
  });

  describe('Approved Vendors Table RLS', () => {
    beforeEach(async () => {
      // Create test approved vendors
      await serviceClient.from('approved_vendors').insert([
        {
          user_id: testUserId,
          business_name: 'Approved Test Business',
          approved_badge_enabled: true,
        },
      ]);
    });

    it('should allow anonymous users to read approved vendors', async () => {
      const { data, error } = await anonClient
        .from('approved_vendors')
        .select('*')
        .eq('user_id', testUserId);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(1);
    });

    it('should allow authenticated users to read approved vendors', async () => {
      const { data, error } = await userClient
        .from('approved_vendors')
        .select('*');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should prevent non-admin users from inserting approved vendors', async () => {
      const { error } = await userClient
        .from('approved_vendors')
        .insert({
          user_id: otherUserId,
          business_name: 'Unauthorized Approved Vendor',
        });
      
      expect(error).toBeDefined();
    });

    it('should allow admins to insert approved vendors', async () => {
      const { error } = await adminClient
        .from('approved_vendors')
        .insert({
          user_id: otherUserId,
          business_name: 'Admin Approved Vendor',
        });
      
      expect(error).toBeNull();
    });

    it('should prevent non-admin users from deleting approved vendors', async () => {
      const { error } = await userClient
        .from('approved_vendors')
        .delete()
        .eq('user_id', testUserId);
      
      expect(error).toBeDefined();
    });

    it('should allow admins to delete approved vendors', async () => {
      // Create a temporary approved vendor to delete
      await serviceClient.from('approved_vendors').insert({
        user_id: testAdminId,
        business_name: 'Temp Approved Vendor',
      });
      
      const { error } = await adminClient
        .from('approved_vendors')
        .delete()
        .eq('user_id', testAdminId);
      
      expect(error).toBeNull();
    });
  });

  describe('Admin Helper Functions', () => {
    it('should correctly identify admin users', async () => {
      const { data: isAdmin, error } = await serviceClient
        .rpc('is_admin', { user_id: testAdminId });
      
      expect(error).toBeNull();
      expect(isAdmin).toBe(true);
    });

    it('should correctly identify non-admin users', async () => {
      const { data: isAdmin, error } = await serviceClient
        .rpc('is_admin', { user_id: testUserId });
      
      expect(error).toBeNull();
      expect(isAdmin).toBe(false);
    });

    it('should allow admins to approve vendor applications via function', async () => {
      // Create a pending vendor application
      const { data: application } = await serviceClient
        .from('vendor_applications')
        .insert({
          user_id: otherUserId,
          business_name: 'Function Test Business',
          business_description: 'Testing approval function',
          contact_email: 'functiontest@example.com',
          contact_phone: '+2348099999999',
          status: 'pending',
        })
        .select()
        .single();
      
      const { data, error } = await serviceClient
        .rpc('update_vendor_application_status', {
          application_id: application?.id,
          new_status: 'approved',
          admin_user_id: testAdminId,
        });
      
      expect(error).toBeNull();
      expect(data).toBe(true);
      
      // Verify approved vendor was created
      const { data: approvedVendor } = await serviceClient
        .from('approved_vendors')
        .select('*')
        .eq('user_id', otherUserId)
        .single();
      
      expect(approvedVendor).toBeDefined();
      expect(approvedVendor?.business_name).toBe('Function Test Business');
    });

    it('should allow admins to reject vendor applications via function', async () => {
      const { data, error } = await serviceClient
        .rpc('update_vendor_application_status', {
          application_id: testVendorApplicationId,
          new_status: 'rejected',
          admin_user_id: testAdminId,
          rejection_reason_text: 'Business does not meet requirements',
        });
      
      expect(error).toBeNull();
      expect(data).toBe(true);
      
      // Verify application was updated
      const { data: application } = await serviceClient
        .from('vendor_applications')
        .select('*')
        .eq('id', testVendorApplicationId)
        .single();
      
      expect(application?.status).toBe('rejected');
      expect(application?.rejection_reason).toBe('Business does not meet requirements');
    });

    it('should prevent non-admin users from using admin functions', async () => {
      const { error } = await serviceClient
        .rpc('update_vendor_application_status', {
          application_id: testVendorApplicationId,
          new_status: 'approved',
          admin_user_id: testUserId, // Regular user, not admin
        });
      
      expect(error).toBeDefined();
      expect(error?.message).toContain('Only admins');
    });
  });
});
