from flask import render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from forms import LoginForm, RegistrationForm
from database import mongo
from models import User

def init_routes(app):
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        
        form = RegistrationForm()
        if form.validate_on_submit():
            try:
                password_hash = User.set_password(form.password.data)
                user = User(
                    username=form.username.data,
                    email=form.email.data,
                    password_hash=password_hash
                )
                mongo.insert_user(user)
                flash('Congratulations, you are now registered!', 'success')
                return redirect(url_for('login'))
            except Exception as e:
                flash('Error creating user. Please try again.', 'danger')
        
        return render_template('register.html', title='Register', form=form)

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        
        form = LoginForm()
        if form.validate_on_submit():
            user = mongo.find_user_by_username(form.username.data)
            if user is None or not user.check_password(form.password.data):
                flash('Invalid username or password', 'danger')
                return redirect(url_for('login'))
            
            login_user(user, remember=True)
            next_page = request.args.get('next')
            if not next_page or not next_page.startswith('/'):
                next_page = url_for('dashboard')
            return redirect(next_page)
        
        return render_template('login.html', title='Sign In', form=form)

    @app.route('/dashboard')
    @login_required
    def dashboard():
        return render_template('dashboard.html', title='Dashboard')

    @app.route('/logout')
    def logout():
        logout_user()
        return redirect(url_for('index'))