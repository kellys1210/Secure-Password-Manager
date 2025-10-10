from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/api/user_auth', methods=['POST'])
def authenticate_user():
    """
    Endpoint to receive data via HTTP POST request
    Expects JSON payload with data
    """
    try:
        data = request.get_json()

        # Extract data
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        username, hashed_master_key = data.get('user_name'), data.get('hashed_maser_key')

        # TODO: Verify information matches database
        # TODO: Send status codes if authentication failed? Or I guess just information in string format?

        # Return success response
        # return jsonify({
        #     'status': 'success',
        #     'message': 'Data received successfully',
        #     'received': username
        # }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
