/**
 * Production Admin User Creation Script
 * Task 10.17: Database setup and migration for production
 * 
 * This script creates an admin user account for production with proper role assignment.
 * 
 * USAGE:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   ADMIN_EMAIL=xxx ADMIN_PASSWORD=xxx ADMIN_FULL_NAME=xxx \
 *   tsx scripts/create-production-admin.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'Platform Administrator';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Missing admin credentials:');
  console.error('   ADMIN_EMAIL - Email address for admin user');
  console.error('   ADMIN_PASSWORD - Secure password (min 8 chars)');
  console.error('   ADMIN_FULL_NAME - Admin user full name (optional)');
  process.exit(1);
}

// Validate password strength
if (ADMIN_PASSWORD.length < 8) {
  console.error('❌ Admin password must be at least 8 characters');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkExistingAdmin(): Promise<string | null> {
  console.log('🔍 Checking for existing admin user...');

  // Check if user with this email already exists
  const { data: existingUser, error } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', ADMIN_EMAIL)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found, which is expected
    console.log(`   ⚠️  Error checking existing user: ${error.message}`);
    return null;
  }

  if (existingUser) {
    console.log(`   ⚠️  User with email ${ADMIN_EMAIL} already exists`);
    console.log(`   User ID: ${existingUser.id}`);
    console.log(`   Current Role: ${existingUser.role || 'user'}`);
    return existingUser.id;
  }

  console.log('   ✅ No existing admin user found');
  return null;
}

async function createAdminUser(): Promise<string | null> {
  console.log('\n👤 Creating admin user account...');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Name: ${ADMIN_FULL_NAME}`);

  try {
    // Create auth user using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: ADMIN_FULL_NAME,
      },
    });

    if (authError) {
      console.log(`   ❌ Failed to create auth user: ${authError.message}`);
      return null;
    }

    if (!authData.user) {
      console.log('   ❌ No user data returned');
      return null;
    }

    console.log('   ✅ Auth user created successfully');
    console.log(`   User ID: ${authData.user.id}`);

    return authData.user.id;
  } catch (err) {
    console.log(`   ❌ Error creating admin user: ${err}`);
    return null;
  }
}

async function ensureUserRecord(userId: string): Promise<boolean> {
  console.log('\n📝 Ensuring user record in database...');

  // Check if user record exists
  const { data: existingRecord, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (!checkError && existingRecord) {
    console.log('   ✅ User record already exists');
    return true;
  }

  // Create user record
  const { error: insertError } = await supabase.from('users').insert({
    id: userId,
    email: ADMIN_EMAIL,
    username: ADMIN_EMAIL.split('@')[0],
    bio: 'Platform Administrator',
  });

  if (insertError) {
    console.log(`   ⚠️  Could not create user record: ${insertError.message}`);
    console.log('   ℹ️  This may be handled by auth triggers');
    return true; // Continue anyway, might be handled by triggers
  }

  console.log('   ✅ User record created');
  return true;
}

async function setAdminRole(userId: string): Promise<boolean> {
  console.log('\n🔐 Setting admin role...');

  try {
    // Update user role to admin
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.log(`   ❌ Failed to set admin role: ${error.message}`);
      
      // Try alternative: using raw metadata update
      const { error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: 'admin' },
      });

      if (metadataError) {
        console.log(`   ❌ Failed to set role via metadata: ${metadataError.message}`);
        return false;
      }

      console.log('   ✅ Admin role set via user metadata');
      return true;
    }

    console.log('   ✅ Admin role set successfully');
    console.log(`   User: ${data.email}`);
    console.log(`   Role: ${data.role}`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error setting admin role: ${err}`);
    return false;
  }
}

async function verifyAdminAccess(userId: string): Promise<boolean> {
  console.log('\n✅ Verifying admin access...');

  try {
    // Check user record
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.log(`   ❌ Cannot verify user: ${error.message}`);
      return false;
    }

    console.log(`   ✅ User verified:`);
    console.log(`      ID: ${user.id}`);
    console.log(`      Email: ${user.email}`);
    console.log(`      Role: ${user.role || 'user (not set)'}`);

    if (user.role === 'admin') {
      console.log('   ✅ Admin role confirmed');
      return true;
    } else {
      console.log('   ⚠️  Admin role not set or different value');
      return false;
    }
  } catch (err) {
    console.log(`   ❌ Error verifying admin: ${err}`);
    return false;
  }
}

async function displayAdminCredentials(): void {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    ADMIN CREDENTIALS                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log(`📧 Email: ${ADMIN_EMAIL}`);
  console.log(`🔑 Password: ${ADMIN_PASSWORD.replace(/./g, '*')}`);
  console.log(`   (Password stored in environment variable)\n`);
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('   1. Store these credentials in a secure password manager');
  console.log('   2. Do not commit these credentials to version control');
  console.log('   3. Change the password after first login');
  console.log('   4. Enable 2FA if available');
  console.log('   5. Limit admin access to trusted team members only\n');
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        PRODUCTION ADMIN USER CREATION SCRIPT                  ║');
  console.log('║        Task 10.17: Database setup and migration              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`\n🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  // Check for existing admin
  const existingUserId = await checkExistingAdmin();

  let userId: string | null = existingUserId;

  // Create admin user if doesn't exist
  if (!existingUserId) {
    userId = await createAdminUser();
    if (!userId) {
      console.log('\n❌ Failed to create admin user');
      process.exit(1);
    }
  } else {
    console.log('\n   ℹ️  Using existing user account');
    userId = existingUserId;
  }

  // Ensure user record exists
  await ensureUserRecord(userId);

  // Set admin role
  const roleSet = await setAdminRole(userId);
  if (!roleSet) {
    console.log('\n⚠️  Warning: Could not set admin role');
    console.log('   You may need to set it manually via SQL:');
    console.log(`   UPDATE users SET role = 'admin' WHERE id = '${userId}';`);
  }

  // Verify admin access
  const verified = await verifyAdminAccess(userId);

  // Display credentials
  await displayAdminCredentials();

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  if (verified) {
    console.log('║              ✅ ADMIN USER CREATED SUCCESSFULLY               ║');
    console.log('║                                                               ║');
    console.log('║  Next Steps:                                                  ║');
    console.log('║  1. Test login at your production URL                        ║');
    console.log('║  2. Verify admin dashboard access                            ║');
    console.log('║  3. Change password after first login                        ║');
    console.log('║  4. Set up 2FA if available                                  ║');
  } else {
    console.log('║              ⚠️  ADMIN USER CREATION INCOMPLETE               ║');
    console.log('║                                                               ║');
    console.log('║  Review warnings above and complete manual steps             ║');
  }
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  process.exit(verified ? 0 : 1);
}

main().catch((error) => {
  console.error('\n❌ Script error:', error);
  process.exit(1);
});
