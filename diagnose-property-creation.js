// Comprehensive diagnostic script for property creation issues
// Run this in the browser console on the post-property page

import { supabase } from '/src/integrations/supabase/client.js';

async function diagnosePropertyCreation() {
  console.log('🔍 Starting comprehensive property creation diagnosis...');

  // 1. Check Supabase configuration
  console.log('1. Checking Supabase configuration...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return;
    }
    console.log('✅ Supabase connection successful');
  } catch (err) {
    console.error('❌ Supabase connection error:', err);
    return;
  }

  // 2. Check authentication
  console.log('2. Checking authentication...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Session error:', error);
      return;
    }
    if (!session) {
      console.error('❌ No active session');
      return;
    }
    console.log('✅ User authenticated:', session.user.id);
    console.log('   Email:', session.user.email);
  } catch (err) {
    console.error('❌ Authentication check failed:', err);
    return;
  }

  // 3. Check if properties table exists
  console.log('3. Checking properties table...');
  try {
    const { data, error } = await supabase.from('properties').select('*').limit(1);
    if (error) {
      console.error('❌ Properties table query failed:', error);
      console.error('   This suggests the table doesn\'t exist or RLS is blocking access');
      return;
    }
    console.log('✅ Properties table exists and is accessible');
  } catch (err) {
    console.error('❌ Properties table check failed:', err);
    return;
  }

  // 4. Check table structure
  console.log('4. Checking table structure...');
  try {
    // Try to get column information (this might not work in all Supabase setups)
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'properties' });
    if (error) {
      console.log('⚠️ Could not get column info (this is normal):', error.message);
    } else {
      console.log('✅ Table columns:', data);
    }
  } catch (err) {
    console.log('⚠️ Column check failed (this is normal):', err.message);
  }

  // 5. Test property insertion with minimal data
  console.log('5. Testing property insertion...');
  const testProperty = {
    owner_id: (await supabase.auth.getSession()).data.session?.user.id,
    property_type: 'residential',
    listing_type: 'sale',
    title: 'Test Property - Diagnostic',
    description: 'This is a test property created by the diagnostic script',
    price: 100000,
    city: 'Test City',
    state: 'Test State',
    images: [],
    status: 'pending'
  };

  console.log('Test property data:', testProperty);

  try {
    const { data, error } = await supabase
      .from('properties')
      .insert(testProperty)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Property insertion failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      // Check for specific error types
      if (error.code === '23503') {
        console.error('🔍 FOREIGN KEY VIOLATION: owner_id does not exist in auth.users');
        console.error('   This means the user is not properly authenticated or the user ID is invalid');
      } else if (error.code === '23505') {
        console.error('🔍 UNIQUE VIOLATION: Duplicate key value');
      } else if (error.code === '23502') {
        console.error('🔍 NOT NULL VIOLATION: A required field is null');
      } else if (error.code === '42703') {
        console.error('🔍 UNDEFINED COLUMN: A column name is incorrect');
      } else if (error.code === '42804') {
        console.error('🔍 DATATYPE MISMATCH: Wrong data type for a column');
      }
    } else {
      console.log('✅ Property insertion successful:', data);
      console.log('🧹 Cleaning up test property...');

      // Clean up the test property
      await supabase.from('properties').delete().eq('id', data.id);
      console.log('✅ Test property cleaned up');
    }
  } catch (err) {
    console.error('❌ Property insertion exception:', err);
  }

  // 6. Check RLS status
  console.log('6. Checking RLS policies...');
  try {
    // This will fail if RLS is enabled and no policy allows the operation
    const { data, error } = await supabase.from('properties').select('*').limit(1);
    if (error && error.message.includes('policy')) {
      console.error('❌ RLS policy blocking access:', error);
    } else {
      console.log('✅ RLS policies allow read access');
    }
  } catch (err) {
    console.log('⚠️ RLS check inconclusive:', err.message);
  }

  console.log('🔍 Diagnosis complete. Check the console output above for issues.');
}

// Run the diagnosis
diagnosePropertyCreation();