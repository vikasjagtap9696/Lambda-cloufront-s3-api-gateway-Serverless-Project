# 🚀 Serverless Employee Management System on AWS

A modern, responsive, and secure Serverless Employee Management System built using AWS cloud infrastructure. This project demonstrates how to leverage serverless services such as DynamoDB, Lambda, API Gateway, S3, CloudFront, Route53, and AWS Cognito to build a scalable and production-ready web application.

---

## 📐 Architecture Diagram
This application is designed using a multi-tier serverless architecture:
* **Frontend**: Hosted on **Amazon S3** (Static Website Hosting) and accelerated globally via **Amazon CloudFront** CDN.
* **DNS & SSL**: Managed via **Amazon Route 53**.
* **Authentication**: Secured using **AWS Cognito User Pools** (with Cognito Hosted UI).
* **API Layer**: Managed by **Amazon API Gateway** (REST API) with CORS enabled.
* **Compute**: Executed using **AWS Lambda** (Python 3.x functions with Boto3).
* **Database**: High-performance, schema-less **Amazon DynamoDB** table.

*Refer to the local [architecture.png](file:///d:/aws/Lambda-cloufront-s3-api%20gateway%20Serverless%20Project/architecture.png) for a visual breakdown of the data flow and AWS services.*

---

## 📂 Project Repository Structure
```directory
├── Frontend and Backend/
│   ├── index.html        # Modern Glassmorphism Responsive UI
│   └── scripts.js        # ES6+ AJAX controller with LocalStorage Caching
├── python Code/
│   ├── getEmployees.py        # Lambda: Scan DynamoDB and fetch all records
│   ├── insertEmployeeData.py  # Lambda: Insert/Save new employee details
│   ├── updateEmployee.py      # Lambda: Update existing employee details
│   └── deleteEmployee.py      # Lambda: Delete employee records from DynamoDB
├── architecture.png      # High-level architecture diagram
├── instructions          # Raw project setup notes
└── README.md             # Detailed guide & deployment instructions
```

---

## 🛠️ Detailed Step-by-Step AWS Setup Instructions

### Step 1: Create the Database (Amazon DynamoDB)
1. Open the AWS Management Console and navigate to **DynamoDB**.
2. Click **Create table**.
3. Configure the table details:
   - **Table name**: `employeeData`
   - **Partition key**: `employeeid` (Type: **String**)
4. Leave the remaining settings as default and click **Create table**.

### Step 2: Create Lambda IAM Role
1. Navigate to **IAM (Identity and Access Management)**.
2. Select **Roles** in the left navigation pane, then click **Create role**.
3. Configure the role:
   - **Trusted entity type**: AWS Service
   - **Use case**: **Lambda**
4. Under permissions, search for and attach:
   - `AmazonDynamoDBFullAccess` (or create a custom inline policy allowing CRUD operations on the `employeeData` DynamoDB table for maximum security).
   - `AWSLambdaBasicExecutionRole` (for CloudWatch logging).
5. Name the role (e.g., `LambdaDynamoDBAccessRole`) and click **Create role**.

### Step 3: Deploy AWS Lambda Functions
You need to deploy the backend functions in the AWS Lambda console. Repeat these steps for each function in the `python Code` directory:

#### 1. Function: `getEmployee`
- **Console Name**: `getEmployee` (loads all employees)
- **Runtime**: **Python 3.x**
- **Execution Role**: Choose *Use an existing role* -> Select the IAM role created in Step 2.
- **Code**: Copy & paste the contents of [getEmployees.py](file:///d:/aws/Lambda-cloufront-s3-api%20gateway%20Serverless%20Project/python%20Code/getEmployees.py).
- **Region Configuration**: Ensure DynamoDB connection matches the client configuration (default is `ap-south-1`).

#### 2. Function: `insertEmployeeData`
- **Console Name**: `insertEmployeeData` (adds or updates employees)
- **Runtime**: **Python 3.x**
- **Execution Role**: Choose *Use an existing role* -> Select the IAM role created in Step 2.
- **Code**: Copy & paste the contents of [insertEmployeeData.py](file:///d:/aws/Lambda-cloufront-s3-api%20gateway%20Serverless%20Project/python%20Code/insertEmployeeData.py).

#### 3. Functions: `updateEmployee` and `deleteEmployee` (Optional / Advanced CRUD)
- Setup Lambda functions for [updateEmployee.py](file:///d:/aws/Lambda-cloufront-s3-api%20gateway%20Serverless%20Project/python%20Code/updateEmployee.py) and [deleteEmployee.py](file:///d:/aws/Lambda-cloufront-s3-api%20gateway%20Serverless%20Project/python%20Code/deleteEmployee.py) using the same execution role if you want to support direct deletes/edits in your custom API Gateway routes.

---

### Step 4: Configure API Gateway (REST API)
To expose the Lambda functions as secure endpoints, set up a REST API:

1. Navigate to **API Gateway** -> click **Create API** -> choose **REST API** (Build).
2. Configure settings:
   - **API Name**: `employee`
   - **API Endpoint Type**: **Edge-Optimized**
3. Create Resource and Methods:
   - **GET Method**:
     - Click **Create Method**.
     - Method Type: **GET**.
     - Integration Type: **Lambda Function**.
     - Select Lambda Region (e.g., `ap-south-1` / Mumbai).
     - Select Lambda Function: `getEmployee`.
     - Click **Create method** and run a test to ensure it scans the table successfully (returns `[]` if the table is empty).
   - **POST Method**:
     - Click **Create Method**.
     - Method Type: **POST**.
     - Integration Type: **Lambda Function**.
     - Select Lambda Region.
     - Select Lambda Function: `insertEmployeeData`.
     - Click **Create method**.
4. **Enable CORS (Cross-Origin Resource Sharing)**:
   - Select the root API or method -> Click **Enable CORS**.
   - Check **GET** and **POST** methods.
   - Click **Save/Confirm**.
5. **Deploy the API**:
   - Click **Deploy API**.
   - Stage: **New Stage**.
   - Stage name: `employeeapi` (or custom name).
6. **Update Frontend Configuration**:
   - Copy the generated **Invoke URL** (e.g., `https://<api-id>.execute-api.ap-south-1.amazonaws.com/employeeapi`).
   - Open [scripts.js](file:///d:/aws/Lambda-cloufront-s3-api%20gateway%20Serverless%20Project/Frontend%20and%20Backend/scripts.js) and update the `CONFIG.API_ENDPOINT` variable at the top:
     ```javascript
     const CONFIG = {
         API_ENDPOINT: "https://<your-api-id>.execute-api.ap-south-1.amazonaws.com/employeeapi",
         // ...
     };
     ```

---

### Step 5: Static Web Hosting on S3
1. Navigate to **Amazon S3** and click **Create bucket**.
2. Give the bucket a unique name (e.g., `serverlessproject-own-website`).
3. Under **Block Public Access settings**, uncheck **Block all public access** (acknowledge the warnings, as this bucket will host a public static website).
4. Create the bucket.
5. Upload [index.html](file:///d:/aws/Lambda-cloufront-s3-api%20gateway%20Serverless%20Project/Frontend%20and%20Backend/index.html) and [scripts.js](file:///d:/aws/Lambda-cloufront-s3-api%20gateway%20Serverless%20Project/Frontend%20and%20Backend/scripts.js) directly to the bucket.
6. Enable Static Website Hosting:
   - Go to the **Properties** tab.
   - Scroll down to **Static website hosting** and click **Edit**.
   - Select **Enable**.
   - Specify **Index document**: `index.html`.
   - Save changes.
7. Add a **Bucket Policy** to allow public reads:
   - Go to the **Permissions** tab -> **Bucket policy** -> **Edit**.
   - Copy-paste the policy below (replace `serverlessproject-own` with your actual bucket name):
     ```json
     {
       "Id": "Policy1722070443537",
       "Version": "2012-10-17",
       "Statement": [
         {
           "Sid": "Stmt1722070442353",
           "Action": [
             "s3:GetObject"
           ],
           "Effect": "Allow",
           "Resource": "arn:aws:s3:::serverlessproject-own/*",
           "Principal": "*"
         }
       ]
     }
     ```
   - Save the policy.
8. Open the static website URL to access the Frontend application interface.

---

### Step 6: Set up Amazon CloudFront and Route 53 (Production Deployment)
1. Go to **Amazon CloudFront** -> **Create distribution**.
2. Set **Origin domain** to your S3 bucket static website endpoint URL (or choose S3 bucket and use Origin Access Control / OAC).
3. Set viewer protocol policy to **Redirect HTTP to HTTPS**.
4. Configure DNS in **Route 53** by creating an `A` record pointing to the CloudFront distribution domain name.

---

### Step 7: Secure the Application with AWS Cognito
1. Navigate to **AWS Cognito** -> click **Create user pool**.
2. **Configure sign-in experience**: Select **Email** as the sign-in option. Click Next.
3. **Configure security requirements**: Select **No MFA** (for development default) and leave the rest as default. Click Next.
4. **Configure sign-up experience**: Add required attributes if needed (e.g. `given_name`, `family_name` for firstname/lastname). Click Next.
5. **Configure message delivery**: Keep defaults (Send email with Cognito). Click Next.
6. **Integrate your app**:
   - User pool name: `projectuserpool`.
   - Hosted UI: Select **Use the Cognito Hosted UI**.
   - Cognito domain: Select **Use a Cognito domain** and provide a prefix name (e.g., `project-employees-auth`).
   - App client type: **Public client**.
   - App client name: `projectuserpool`.
   - Client secret: Select **Don't generate a client secret**.
   - Allowed callback URLs: Enter your secure CloudFront / Route 53 HTTPS domain URL.
7. Click **Create user pool**.
8. Test authentication by navigating to the pool's **App Integration** tab, choosing your app client, and clicking **Open hosted UI** to sign up a test user and log in.

---

## 🚀 How to Push this Repository to GitHub

To store this code in a secure GitHub repository, run the following commands in your local command prompt or PowerShell terminal from this project root folder:

### 1. Initialize Git Repository
```bash
git init
```

### 2. Create `.gitignore`
It is a best practice to exclude temporary logs, system files, and IDE configurations. Create a file named `.gitignore` in the root folder with:
```text
# AWS / Node / OS files
.DS_Store
Thumbs.db
.aws/
*.log
.gemini/
```

### 3. Stage and Commit Files
Add files to the Git repository stage and perform the first local commit:
```bash
git add .
git commit -m "Initial commit: Serverless Employee Management System architecture, frontend and backend"
```

### 4. Create Repository on GitHub
1. Log in to your account at [github.com](https://github.com).
2. Click the **New** button to create a new repository.
3. Name your repository (e.g., `aws-lambda-cloudfront-s3-serverless-project`).
4. Keep the repository public or private depending on your preference.
5. **Do not** initialize it with a README, gitignore, or license (since we have already created them locally).
6. Click **Create repository**.

### 5. Link Local Repository and Push
Copy the Git push commands from your GitHub repository setup page and run:
```bash
# Rename the default branch to main
git branch -M main

# Link your local repo to the remote GitHub repo
git remote add origin https://github.com/<your-github-username>/aws-lambda-cloudfront-s3-serverless-project.git

# Push the code to the main branch
git push -u origin main
```

---

## 🔒 Security Best Practices
- **Never commit AWS credentials** (`access_key_id` or `secret_access_key`) directly to the repository.
- Use IAM roles and policies to control access between AWS resources instead of hardcoding API keys.
- Keep S3 buckets private and serve content exclusively through CloudFront using **Origin Access Control (OAC)** in production environments.
