// Simple test script - copy and paste this into browser console
// Make sure you're logged in to the app first!

(async function() {
  console.log('🧪 Testing property creation...');

  // Try to find supabase client in the app
  let supabase = null;

  // Check common places where it might be available
  if (window.__vite__ && window.__vite__.ssr) {
    console.log('SSR mode detected, trying different approach...');
  }

  // Look for supabase in global scope
  const possibleNames = ['supabase', 'SupabaseClient', '_supabase', 'supabaseClient'];
  for (const name of possibleNames) {
    if (window[name]) {
      supabase = window[name];
      console.log(`✅ Found supabase in window.${name}`);
      break;
    }
  }

  // If not found, try to access it from the React app
  if (!supabase) {
    try {
      // Try to access it from the app's modules
      const modules = Object.values(window).filter(v =>
        v && typeof v === 'object' && v.supabase
      );
      if (modules.length > 0) {
        supabase = modules[0].supabase;
        console.log('✅ Found supabase in app modules');
      }
    } catch (e) {
      console.log('Could not find supabase in app modules');
    }
  }

  // Last resort: create our own client
  if (!supabase) {
    try {
      console.log('Creating supabase client manually...');
      // Use the same credentials from the app
      const url = 'https://sowjdkokhtrsboxjpvfz.supabase.co';
      const key = 'sb_publishable_fwHe7I0nTYebSmRtkktJKA_E08A3jQA';

      // Create a simple fetch-based client for testing
      supabase = {
        auth: {
          getUser: async () => {
            const token = localStorage.getItem('sb-sowjdkokhtrsboxjpvfz-auth-token');
            if (!token) return { data: { user: null }, error: null };

            try {
              const parsed = JSON.parse(token);
              return { data: { user: parsed.user }, error: null };
            } catch (e) {
              return { data: { user: null }, error: e };
            }
          }
        },
        from: (table) => ({
          insert: async (data) => {
            const token = localStorage.getItem('sb-sowjdkokhtrsboxjpvfz-auth-token');
            if (!token) return { data: null, error: { message: 'No auth token' } };

            const { access_token } = JSON.parse(token);
            const response = await fetch(`${url}/rest/v1/${table}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`,
                'apikey': key
              },
              body: JSON.stringify(data)
            });

            if (!response.ok) {
              const error = await response.text();
              return { data: null, error: { message: error, code: response.status.toString() } };
            }

            const result = await response.json();
            return { data: result, error: null };
          },
          select: () => ({
            single: async () => {
              // This is just for the .select('*').single() chain
              return { data: null, error: null };
            }
          }),
          delete: () => ({
            eq: () => ({
              // This is just for the .delete().eq('id', data.id) chain
              then: (callback) => callback({ data: null, error: null })
            })
          })
        })
      };
      console.log('✅ Created manual supabase client');
    } catch (e) {
      console.error('❌ Failed to create manual client:', e);
      return;
    }
  }

  if (!supabase) {
    console.error('❌ Could not find or create supabase client');
    console.error('Please make sure:');
    console.error('1. You are logged in to the app');
    console.error('2. You are on the correct page (http://localhost:8082)');
    console.error('3. The app is running');
    return;
  }

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ No user logged in:', userError);
    console.error('Please log in to the app first');
    return;
  }
  console.log('✅ User ID:', user.id);

  // Test data
  const testProperty = {
    owner_id: user.id,
    title: 'Test Property - Console Test',
    description: 'Test description for debugging',
    price: 100000,
    city: 'Test City',
    state: 'Test State',
    listing_type: 'sale',
    property_type: 'residential',
    images: [],
    status: 'pending'
  };

  console.log('📝 Test property data:', testProperty);

  try {
    const { data, error } = await supabase
      .from('properties')
      .insert(testProperty)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Insert error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // Provide specific solutions
      if (error.message.includes('permission') || error.code === '42501') {
        console.error('🔐 SOLUTION: Run this SQL in Supabase:');
        console.error('ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;');
      } else if (error.message.includes('foreign key') || error.code === '23503') {
        console.error('🔗 SOLUTION: Check if user exists in auth.users table');
      } else if (error.message.includes('null') || error.code === '23502') {
        console.error('❌ SOLUTION: Check required fields in database schema');
      } else if (error.message.includes('column') || error.code === '42703') {
        console.error('📝 SOLUTION: Database schema mismatch - check table structure');
      }
    } else {
      console.log('✅ Insert successful:', data);
      console.log('🎉 Property creation is working! The issue is in the form submission.');
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }

  console.log('🧪 Test completed');
})();