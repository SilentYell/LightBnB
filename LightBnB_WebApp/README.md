# LightBnB Project

LightBnB is a simple multi-page Airbnb clone that uses server-side JavaScript to display information from SQL queries on web pages.

## Features
- Users can browse available properties.
- Users can create properties.
- Property owners can list their properties with detailed descriptions, images, and rental costs.
- Properties can be marked as active or inactive by their owners.

## Screenshots

### Home Page
![Home Page](/home/labber/lighthouse/LightBnB/images/main_page.jpeg)

### Property Details Page
![Search Page](/home/labber/lighthouse/LightBnB/images/search.jpeg)

## Setup

### Prerequisites
Ensure you have the following installed:
- **Node.js** (v16.20.2 recommended)
- **PostgreSQL** (v12 or later recommended)

### Installation Steps
1. Clone the repository:
```bash
   git clone https://github.com/<your-username>/lightbnb.git
```

2. Navigate to the project directory:
```bash
   cd lightbnb
```

3. Install dependencies:
```bash
   npm install
```

4. Set up the database:
   - Create a new PostgreSQL database:
```sql
     CREATE DATABASE lightbnb;
```
   - Load the schema and seed data:
```bash
     psql -d lightbnb -f migrations/schema.sql
     psql -d lightbnb -f seeds/01_seeds.sql
```

5. Create a `.env` file in the root of your project and configure the following variables:
```env
   DB_HOST=localhost
   DB_USER=<your_database_user>
   DB_PASSWORD=<your_database_password>
   DB_NAME=lightbnb
```

6. Start the server:
```bash
   npm start
```

7. Open your browser and visit:
```
http://localhost:3000
```

## Project Structure
- **`/migrations`**: Contains the database schema.
- **`/seeds`**: Contains seed data for testing.
- **`/public`**: Static assets like CSS and images.
- **`/routes`**: Application routes.
- **`/db`**: Database query functions.
- **`/views`**: HTML templates for rendering pages.

## Database Schema
The database schema includes the following tables:

### Users Table
- `id`: Primary key
- `name`: Name of the user
- `email`: Email address
- `password`: Encrypted password
- `created_at`, `updated_at`: Timestamps

### Properties Table
- `id`: Primary key
- `owner_id`: References `users.id`
- `title`, `description`: Property details
- `thumbnail_photo_url`, `cover_photo_url`: Image URLs
- `cost_per_night`: Cost per night in cents
- `parking_spaces`, `number_of_bathrooms`, `number_of_bedrooms`: Property features
- `country`, `street`, `city`, `province`, `post_code`: Address fields
- `active`: Boolean flag
- `created_at`, `updated_at`: Timestamps

### Reservations Table
- `id`: Primary key
- `start_date`, `end_date`: Reservation dates
- `property_id`: References `properties.id`
- `guest_id`: References `users.id`
- `created_at`, `updated_at`: Timestamps

### Property Reviews Table
- `id`: Primary key
- `guest_id`: References `users.id`
- `property_id`: References `properties.id`
- `reservation_id`: References `reservations.id`
- `rating`: Integer (1-5)
- `message`: Review message
- `created_at`, `updated_at`: Timestamps

## Future Improvements
- Add support for user authentication and account management.
- Implement advanced search and filtering options for properties.
- Enable property owners to respond to reviews.
- Add a mobile-friendly design.

## License
This project is licensed under the MIT License.