# RulerRide Backend

A complete Node.js backend for the RulerRide rural ride-sharing platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Firebase project with Admin SDK
- Razorpay account (for payments)

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Update the configuration with your values

3. **Start the server:**
   ```bash
   npm run dev    # Development mode with nodemon
   npm start      # Production mode
   ```

### Environment Configuration

Create a `.env` file in the backend directory with:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/rulerride

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key

# Firebase (for OTP and messaging)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_firebase_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_CLIENT_ID=your_firebase_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_firebase_client_cert_url

# Razorpay (for payments)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   └── config/         # Configuration files
├── scripts/            # Database seeding scripts
├── server.js          # Main server file
└── package.json
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout user

### Rides (Coming Soon)
- `POST /api/rides/request` - Request a ride
- `GET /api/rides/history` - Get ride history
- `PUT /api/rides/:id/cancel` - Cancel ride

### Payments (Coming Soon)
- `POST /api/payments/create` - Create payment
- `POST /api/payments/verify` - Verify payment

### SOS (Coming Soon)
- `POST /api/sos/alert` - Trigger SOS alert
- `GET /api/sos/alerts` - Get SOS alerts

## 🔌 Real-time Features

The backend includes Socket.IO for real-time features:

- Live driver location tracking
- Ride status updates
- Driver-rider communication
- SOS alert broadcasting
- Automatic driver assignment

### Socket Events

**Client → Server:**
- `authenticate` - Authenticate socket connection
- `driver_location_update` - Update driver location
- `request_ride` - Request a new ride
- `sos_alert` - Send SOS alert

**Server → Client:**
- `driver_assigned` - Driver assigned to ride
- `driver_location` - Driver location update
- `ride_status_update` - Ride status changed
- `sos_alert` - Emergency alert received

## 🗄️ Database Schema

### User Model
- Basic info (name, phone, email)
- Role (rider/driver/admin)
- Profile data and preferences
- Emergency contacts
- Driver-specific info (for drivers)

### Ride Model
- Pickup and destination details
- Vehicle type and fare information
- Status tracking and timestamps
- Route and tracking data
- Rating and feedback

### Payment Model
- Payment details and gateway info
- Fare breakdown and receipts
- Refund handling
- Commission splitting

### SOS Alert Model
- Emergency alert details
- Location and user information
- Response tracking
- Escalation management

## 🛡️ Security Features

- JWT-based authentication
- Phone number verification via OTP
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js security headers

## 🔧 Development

### Scripts
- `npm run dev` - Start with nodemon
- `npm start` - Production start
- `npm test` - Run tests
- `npm run seed` - Seed database

### Testing
```bash
npm test
```

### Database Seeding
```bash
npm run seed
```

## 📈 Monitoring

- Request logging with Morgan
- Error tracking and reporting
- Performance monitoring
- Database connection monitoring

## 🚀 Deployment

The backend is ready for deployment on:
- Heroku
- AWS EC2/ECS
- Google Cloud Platform
- DigitalOcean

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.