import json
import boto3

def lambda_handler(event, context):
    # Initialize a DynamoDB resource object for the specified region
    dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

    # Select the DynamoDB table named 'employeeData'
    table = dynamodb.Table('employeeData')

    try:
        # Parse the request body
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Extract employee data
        employee_id = body.get('employeeid')
        name = body.get('name')
        department = body.get('department')
        salary = body.get('salary')

        # Validate required fields
        if not employee_id or not name or not department or not salary:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'All fields (employeeid, name, department, salary) are required'})
            }

        # Validate salary is a number
        try:
            salary_value = float(salary)
        except ValueError:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Salary must be a valid number'})
            }

        # Update the item in the table
        response = table.update_item(
            Key={'employeeid': employee_id},
            UpdateExpression='SET #name = :name, department = :dept, salary = :sal',
            ExpressionAttributeNames={
                '#name': 'name'
            },
            ExpressionAttributeValues={
                ':name': name,
                ':dept': department,
                ':sal': salary
            },
            ReturnValues='ALL_NEW'
        )

        # Return success response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Employee {employee_id} updated successfully',
                'employee': response['Attributes']
            })
        }

    except Exception as e:
        # Return error response
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Failed to update employee: {str(e)}'
            })
        }
