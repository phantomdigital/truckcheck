/**
 * Script to create Pro user for local development
 * Run with: npm run seed:pro
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";

// For local Supabase, the service role key is a fixed JWT
// This is the default local Supabase service role key
const supabaseServiceKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createProUser() {
  const email = "tom@phantomdigital.au";
  const password = "123456";

  try {
    console.log("Checking for existing user...");
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    if (existingUser) {
      console.log(`User ${email} already exists. Updating to Pro...`);
      
      // Reset password to ensure it works
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );
      if (passwordError) {
        console.error("Error resetting password:", passwordError);
      } else {
        console.log("Password reset successfully!");
      }
      
      // Update subscription_status to 'pro' and add names
      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          first_name: "Tom",
          last_name: "Phantom",
          subscription_status: "pro",
          stripe_customer_id: "cus_TOe732cri6D2eJ",
          stripe_subscription_id: "sub_1SRqqvDIrMdqVwZofn9vAuEg",
          subscription_current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        })
        .eq("id", existingUser.id);

      if (updateError) {
        // If update fails (user doesn't exist in users table), try to insert
        const { error: insertError } = await supabase
          .from("users")
          .insert({ 
            id: existingUser.id, 
            email: existingUser.email,
            first_name: "Tom",
            last_name: "Phantom",
            subscription_status: "pro",
            stripe_customer_id: "cus_TOe732cri6D2eJ",
            stripe_subscription_id: "sub_1SRqqvDIrMdqVwZofn9vAuEg",
            subscription_current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          });
          
        if (insertError) {
          console.error("Error setting Pro status:", insertError);
          console.log("\nPlease run this SQL manually in Supabase Studio:");
          console.log(`INSERT INTO users (id, email, subscription_status, stripe_customer_id, stripe_subscription_id)
VALUES ('${existingUser.id}', '${existingUser.email}', 'pro', 'test_customer_local', 'test_sub_local')
ON CONFLICT (id) DO UPDATE SET subscription_status = 'pro';`);
          return;
        }
      }

      console.log("User upgraded to Pro!");
      console.log(`\nLogin credentials:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Status: Pro (unlimited features)`);
      console.log(`\nYou can now log in and test all Pro features!`);
      return;
    }

    // Create new user
    console.log("Creating new Pro user...");
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: "Tom (Pro User)",
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return;
    }

    if (!newUser.user) {
      console.error("User creation failed - no user returned");
      return;
    }

    console.log("Auth user created!");

    // Set subscription_status to 'pro' in users table (use upsert in case user was auto-created by trigger)
    const { error: proError } = await supabase
      .from("users")
      .upsert({
        id: newUser.user.id,
        email: newUser.user.email,
        first_name: "Tom",
        last_name: "Phantom",
        subscription_status: "pro",
        stripe_customer_id: "cus_TOe732cri6D2eJ",
        stripe_subscription_id: "sub_1SRqqvDIrMdqVwZofn9vAuEg",
        subscription_current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      }, {
        onConflict: 'id'
      });

    if (proError) {
      console.error("❌ Error setting Pro status:", proError);
      return;
    }

    console.log("✅ Pro user created successfully!");
    console.log(`\n🎉 Login credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Status: Pro (unlimited features)`);
    console.log(`\n✨ Pro features enabled:`);
    console.log(`   • Multiple Stops`);
    console.log(`   • CSV Import/Export`);
    console.log(`   • PDF Export`);
    console.log(`   • Calculation History`);
    console.log(`   • Recent Searches`);
    console.log(`   • 100km Radius Toggle`);
    console.log(`   • Ad-free Experience`);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

createProUser();

