<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProcessedFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProcessedFileController extends Controller
{
    /**
     * Store a processed file record.
     * Called by Node.js server after processing files.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'tool_name' => 'required|string|max:255',
            'file_count' => 'required|integer|min:1',
            'status' => 'required|in:pending,processing,completed,failed',
            'file_path' => 'nullable|string',
            'original_filename' => 'nullable|string|max:255',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $processedFile = ProcessedFile::create([
            'user_id' => $request->user_id,
            'tool_name' => $request->tool_name,
            'file_count' => $request->file_count,
            'status' => $request->status,
            'file_path' => $request->file_path,
            'original_filename' => $request->original_filename,
            'metadata' => $request->metadata,
            'processed_at' => $request->status === 'completed' ? now() : null,
        ]);

        $response = response()->json([
            'success' => true,
            'data' => [
                'id' => $processedFile->id,
                'message' => 'Processed file recorded successfully'
            ]
        ], 201);
        
        // Add CORS headers
        return $response->header('Access-Control-Allow-Origin', 'http://82.180.132.134:3000')
                        ->header('Access-Control-Allow-Credentials', 'true')
                        ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                        ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    }
}
