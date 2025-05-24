const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runMigration() {
  // Create pool with your Supabase connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("🔗 Connecting to Supabase database...");
    console.log(
      "Connection string:",
      process.env.DATABASE_URL.replace(/:([^:@]{8})[^:@]*@/, ":****@")
    );

    // Test connection
    const testResult = await pool.query("SELECT NOW()");
    console.log(
      "✅ Database connected successfully at:",
      testResult.rows[0].now
    );

    // Check if migration file exists
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "004_add_customer_name.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.log("❌ Migration file not found at:", migrationPath);
      console.log("📁 Checking available files...");

      const migrationsDir = path.join(__dirname, "migrations");
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir);
        console.log("Available migration files:");
        files.forEach((file) => console.log(`  - ${file}`));
      } else {
        console.log("❌ Migrations directory not found");
      }
      return;
    }

    // Read and display migration
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    console.log("\n📜 Migration content:");
    console.log("---");
    console.log(migrationSQL);
    console.log("---");

    // Check current table structure
    console.log("\n🔍 Current orders table structure:");
    const currentColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position;
    `);

    console.log("Existing columns:");
    currentColumns.rows.forEach((row) => {
      console.log(
        `  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
      );
    });

    // Check if columns already exist
    const hasCustomerName = currentColumns.rows.some(
      (row) => row.column_name === "customer_name"
    );
    const hasCustomerPhone = currentColumns.rows.some(
      (row) => row.column_name === "customer_phone"
    );

    if (hasCustomerName && hasCustomerPhone) {
      console.log("\n✅ Columns already exist! Migration not needed.");
      return;
    }

    // Run migration
    console.log("\n🚀 Running migration...");
    await pool.query(migrationSQL);
    console.log("✅ Migration executed successfully!");

    // Verify the migration worked
    console.log("\n🔍 Verifying migration...");
    const updatedColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('customer_name', 'customer_phone')
      ORDER BY column_name;
    `);

    console.log("New columns added:");
    updatedColumns.rows.forEach((row) => {
      console.log(
        `  ✅ ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
      );
    });

    if (updatedColumns.rows.length === 2) {
      console.log("\n🎉 Migration completed successfully! Both columns added.");
    } else {
      console.log(
        "\n⚠️  Warning: Expected 2 new columns, found",
        updatedColumns.rows.length
      );
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);

    if (error.message.includes("already exists")) {
      console.log(
        "💡 The columns might already exist. This is not necessarily an error."
      );
    } else if (error.message.includes('relation "orders" does not exist')) {
      console.log(
        "💡 The orders table does not exist. You may need to run earlier migrations first."
      );
    } else {
      console.log("💡 Full error details:", error);
    }
  } finally {
    await pool.end();
    console.log("\n🔒 Database connection closed.");
  }
}

// Run the migration
console.log("🏗️  SnackTrack Database Migration Tool");
console.log("=====================================");
runMigration().catch(console.error);
