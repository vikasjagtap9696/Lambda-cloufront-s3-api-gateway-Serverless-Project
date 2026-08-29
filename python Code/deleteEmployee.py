import json
import boto3

def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }

def lambda_handler(event, context):
    # Initialize a DynamoDB resource object for the specified region
    dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

    # Select the DynamoDB table named 'employeeData'
    table = dynamodb.Table('employeeData')

    # Extract the employee ID from the event path or body
    try:
        # Get employee ID from path parameters or request body
        if 'pathParameters' in event and event['pathParameters']:
            path_parameters = event['pathParameters']
            employee_id = path_parameters.get('id') or path_parameters.get('employeeid')
        elif 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
            employee_id = body.get('employeeid')
        else:
            return response(400, {'error': 'Employee ID is required'})

        if not employee_id:
            return response(400, {'error': 'Employee ID cannot be empty'})

        # Delete the item from the table
        table.delete_item(Key={'employeeid': employee_id})

        # Return success response
        return response(200, {
                'message': f'Employee {employee_id} deleted successfully',
                'employeeid': employee_id
            })

    except Exception as e:
        # Return error response
        return response(500, {
                'error': f'Failed to delete employee: {str(e)}'
            })
