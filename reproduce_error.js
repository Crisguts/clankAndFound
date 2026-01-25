const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const testUserId = "00000000-0000-0000-0000-000000000000"; // Dummy UUID
    console.log("Testing insert with user_id:", testUserId);

    const { data, error } = await supabase
        .from("inquiries")
        .insert([{
            user_id: null, // First test with null
            description: "Test inquiry null user",
            status: "submitted"
        }])
        .select();

    if (error) {
        console.error("Insert with null user_id failed:", error);
    } else {
        console.log("Insert with null user_id succeeded:", data[0].id);
    }

    const { data: data2, error: error2 } = await supabase
        .from("inquiries")
        .insert([{
            user_id: testUserId, // This should fail if it doesn't exist in auth.users or if RLS/FK blocks it
            description: "Test inquiry with user_id",
            status: "submitted"
        }])
        .select();

    if (error2) {
        console.error("Insert with user_id failed:", error2);
    } else {
        console.log("Insert with user_id succeeded:", data2[0].id);
    }
}

testInsert();
