const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found at', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local');
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const usersToCreate = [
  {
    email: 'superadmin@actorsstudio.pk',
    password: 'Password123!',
    fullName: 'Super Admin',
    role: 'super_admin'
  },
  {
    email: 'admin@actorsstudio.pk',
    password: 'Password123!',
    fullName: 'Studio Admin',
    role: 'studio_admin'
  },
  {
    email: 'staff@actorsstudio.pk',
    password: 'Password123!',
    fullName: 'Studio Staff',
    role: 'studio_staff'
  },
  {
    email: 'actor@actorsstudio.pk',
    password: 'Password123!',
    fullName: 'Actor User',
    role: 'talent',
    profile: {
      type: 'talent',
      data: {
        full_name: 'Actor User',
        stage_name: 'Superstar Actor',
        dob: '1995-05-15',
        gender: 'male',
        city: 'Karachi',
        country: 'Pakistan',
        experience_years: 5,
        languages: ['English', 'Urdu'],
        skills: ['Acting', 'Dancing', 'Voice Acting'],
        bio: 'Professional actor with experience in theatre and television.',
        verification_status: 'approved',
        is_premium: true,
        subscription_tier: 'premium',
        slug: 'actor-user',
        is_available: true
      }
    }
  },
  {
    email: 'producer@actorsstudio.pk',
    password: 'Password123!',
    fullName: 'Producer User',
    role: 'producer_brand',
    profile: {
      type: 'producer',
      data: {
        company_name: 'Studio Productions',
        company_type: 'production_house',
        verified: true,
        website: 'https://studioproductions.pk',
        bio: 'Leading production house for TV commercials and feature films.'
      }
    }
  },
  {
    email: 'director@actorsstudio.pk',
    password: 'Password123!',
    fullName: 'Casting Director',
    role: 'casting_director',
    profile: {
      type: 'producer', // Casting directors also have a profile in producer_profiles as seen in onboarding UI
      data: {
        company_name: 'Director Casting Agency',
        company_type: 'individual',
        verified: true,
        website: 'https://directorcasting.pk',
        bio: 'Independent Casting Director conducting auditions across Pakistan.'
      }
    }
  },
  {
    email: 'agent@actorsstudio.pk',
    password: 'Password123!',
    fullName: 'Agent Manager',
    role: 'agent_manager',
    profile: {
      type: 'agent',
      data: {
        agency_name: 'Talent Agency Inc'
      }
    }
  }
];

async function seed() {
  for (const userDef of usersToCreate) {
    console.log(`\nProcessing ${userDef.role} (${userDef.email})...`);

    // Check if user already exists in auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError.message);
      continue;
    }

    let user = users.find(u => u.email === userDef.email);
    let userId;

    if (user) {
      console.log(`User already exists in auth.users with ID: ${user.id}`);
      userId = user.id;
    } else {
      // Create user
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: userDef.email,
        password: userDef.password,
        email_confirm: true,
        user_metadata: {
          full_name: userDef.fullName
        }
      });

      if (createError) {
        console.error(`Failed to create auth user for ${userDef.email}:`, createError.message);
        continue;
      }

      user = createData.user;
      console.log(`Created auth user with ID: ${user.id}`);
      userId = user.id;
    }

    // Ensure the user exists in public.users and has the correct role
    const { data: publicUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !publicUser) {
      console.log(`User not found in public.users. Inserting...`);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userDef.email,
          role: userDef.role,
          status: 'active'
        });
      
      if (insertError) {
        console.error(`Failed to insert public user row:`, insertError.message);
        continue;
      }
    } else {
      console.log(`Updating role in public.users to: ${userDef.role}`);
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: userDef.role })
        .eq('id', userId);

      if (updateError) {
        console.error(`Failed to update user role:`, updateError.message);
        continue;
      }
    }

    // Seed profile details if defined
    if (userDef.profile) {
      const { type, data } = userDef.profile;
      if (type === 'talent') {
        const { data: existingProfile } = await supabase
          .from('talent_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          console.log('Talent profile already exists. Updating...');
          const { error: profileError } = await supabase
            .from('talent_profiles')
            .update(data)
            .eq('user_id', userId);
          if (profileError) {
            console.error('Failed to update talent profile:', profileError.message);
          } else {
            console.log('Talent profile updated successfully.');
          }
        } else {
          console.log('Creating talent profile...');
          const { error: profileError } = await supabase
            .from('talent_profiles')
            .insert({ user_id: userId, ...data });
          if (profileError) {
            console.error('Failed to create talent profile:', profileError.message);
          } else {
            console.log('Talent profile created successfully.');
          }
        }
      } else if (type === 'producer') {
        const { data: existingProfile } = await supabase
          .from('producer_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          console.log('Producer profile already exists. Updating...');
          const { error: profileError } = await supabase
            .from('producer_profiles')
            .update(data)
            .eq('user_id', userId);
          if (profileError) {
            console.error('Failed to update producer profile:', profileError.message);
          } else {
            console.log('Producer profile updated successfully.');
          }
        } else {
          console.log('Creating producer profile...');
          const { error: profileError } = await supabase
            .from('producer_profiles')
            .insert({ user_id: userId, ...data });
          if (profileError) {
            console.error('Failed to create producer profile:', profileError.message);
          } else {
            console.log('Producer profile created successfully.');
          }
        }
      } else if (type === 'agent') {
        const { data: existingProfile } = await supabase
          .from('agent_managers')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          console.log('Agent manager profile already exists. Updating...');
          const { error: profileError } = await supabase
            .from('agent_managers')
            .update(data)
            .eq('user_id', userId);
          if (profileError) {
            console.error('Failed to update agent manager profile:', profileError.message);
          } else {
            console.log('Agent manager profile updated successfully.');
          }
        } else {
          console.log('Creating agent manager profile...');
          const { error: profileError } = await supabase
            .from('agent_managers')
            .insert({ user_id: userId, ...data });
          if (profileError) {
            console.error('Failed to create agent manager profile:', profileError.message);
          } else {
            console.log('Agent manager profile created successfully.');
          }
        }
      }
    }
  }

  console.log('\nSeeding completed successfully!');
}

seed().catch(err => {
  console.error('Unexpected seeding error:', err);
});
