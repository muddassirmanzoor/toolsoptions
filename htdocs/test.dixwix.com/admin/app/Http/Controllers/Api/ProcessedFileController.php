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
        // Log incoming request for debugging
        \Log::info('ProcessedFileController::store called', [
            'request_data' => $request->all(),
            'user_id' => $request->user_id,
            'tool_name' => $request->tool_name,
        ]);
        
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
            \Log::error('ProcessedFileController validation failed', [
                'errors' => $validator->errors()->toArray(),
                'request_data' => $request->all(),
            ]);
            
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
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

            \Log::info('ProcessedFile created successfully', [
                'id' => $processedFile->id,
                'user_id' => $processedFile->user_id,
                'tool_name' => $processedFile->tool_name,
            ]);

            $response = response()->json([
                'success' => true,
                'data' => [
                    'id' => $processedFile->id,
                    'message' => 'Processed file recorded successfully'
                ]
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating ProcessedFile', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create processed file record',
                'error' => $e->getMessage()
            ], 500);
        }
        
        // Add CORS headers
        return $response->header('Access-Control-Allow-Origin', 'http://82.180.132.134:3000')
                        ->header('Access-Control-Allow-Credentials', 'true')
                        ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                        ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    }

    /**
     * Get processed file info by ID.
     * Called by Node.js server to serve files.
     */
    public function show($id)
    {
        try {
            // Only return non-deleted files (soft delete)
            $file = ProcessedFile::find($id);
            
            if (!$file) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $file->id,
                    'file_path' => $file->file_path,
                    'original_filename' => $file->original_filename,
                ]
            ], 200)
            ->header('Access-Control-Allow-Origin', 'http://82.180.132.134:3000')
            ->header('Access-Control-Allow-Credentials', 'true')
            ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
        } catch (\Exception $e) {
            \Log::error('Error fetching ProcessedFile', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch file info',
                'error' => $e->getMessage()
            ], 500)
            ->header('Access-Control-Allow-Origin', 'http://82.180.132.134:3000')
            ->header('Access-Control-Allow-Credentials', 'true')
            ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
        }
    }
}
