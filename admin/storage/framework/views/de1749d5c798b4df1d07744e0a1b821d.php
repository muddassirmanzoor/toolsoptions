<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ILovePDF</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4a90e2;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4a90e2;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to ILovePDF!</h1>
    </div>
    <div class="content">
        <h2>Hello <?php echo e($user->first_name); ?> <?php echo e($user->last_name); ?>,</h2>
        
        <p>Thank you for creating an account with ILovePDF! We're excited to have you on board.</p>
        
        <p>Your account has been successfully created with the following details:</p>
        <ul>
            <li><strong>Name:</strong> <?php echo e($user->first_name); ?> <?php echo e($user->last_name); ?></li>
            <li><strong>Email:</strong> <?php echo e($user->email); ?></li>
            <li><strong>Phone:</strong> <?php echo e($user->country_code); ?> <?php echo e($user->phone_number); ?></li>
        </ul>
        
        <p>You can now access all our PDF tools and services. If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <div style="text-align: center;">
            <a href="<?php echo e(url('/dashboard')); ?>" class="button">Go to Dashboard</a>
        </div>
        
        <p>Best regards,<br>
        <strong>Dixwix Support Team</strong></p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>If you have any questions, contact us at: <?php echo e(config('mail.from.address')); ?></p>
    </div>
</body>
</html>

<?php /**PATH /home/dixwix-test/htdocs/test.dixwix.com/admin/resources/views/emails/signup.blade.php ENDPATH**/ ?>