from flask import Flask

from qr_image_generator import QrTotpGenerator

app = Flask(__name__)
qr_gen = QrTotpGenerator()


@app.route('/api/setup-2fa')
def setup_2fa():
    username = "user@email.com"  # Get from session/request
    password = "dummy"  # Not actually needed for TOTP

    buffer, secret = qr_gen.generate_qr_code_image(username, password)

    # TODO: Save 'secret' to your database for this user!
    # user.totp_secret = secret

    return qr_gen.send_image(buffer)
