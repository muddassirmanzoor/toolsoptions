<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'company_name')) {
                $table->string('company_name')->nullable()->after('country_code');
            }
            if (!Schema::hasColumn('users', 'business_address')) {
                $table->string('business_address', 500)->nullable()->after('company_name');
            }
            if (!Schema::hasColumn('users', 'tax_id')) {
                $table->string('tax_id', 100)->nullable()->after('business_address');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('users', 'company_name')) {
                $columns[] = 'company_name';
            }
            if (Schema::hasColumn('users', 'business_address')) {
                $columns[] = 'business_address';
            }
            if (Schema::hasColumn('users', 'tax_id')) {
                $columns[] = 'tax_id';
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};

