from flask import Flask


app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World! This is my first Flask app!'

@app.route('/about')
def about():
    return 'About page'

if __name__ == '__main__':
    app.run(debug=True)