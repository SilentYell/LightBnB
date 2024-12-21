const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require('pg');

const pool = new Pool({
  user: 'development',
  password: 'development',
  host: 'localhost',
  database: 'lightbnb'
});

pool.query(`SELECT title FROM properties LIMIT 10;`)
  .then(response => {
    console.log(response.rows);
  })
  .catch(err => {
    console.error('Connection error', err.stack);
  });

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user object or null.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1 LIMIT 1;`, [email])
    .then((response) => {
      if (response.rows[0]) {
        return response.rows[0];
      } else {
        throw new Error(`User with email ${email} not found`);
      }
    })
    .catch((err) => {
      console.error('Error executing getUserWithEmail query', err.stack);
      return Promise.reject(err);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user object or null.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1 LIMIT 1;`, [id])
    .then((response) => {
      if (response.rows[0]) {
        return response.rows[0];
      } else {
        throw new Error(`User with id ${id} not found`);
      }
    })
    .catch((err) => {
      console.error('Error executing getUserWithId query', err.stack);
      return Promise.reject(err);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user The user object.
 * @return {Promise<{}>} A promise to the newly added user object.
 */
const addUser = function(user) {
  const { name, email, password } = user;
  return pool
    .query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING *;`,
      [name, email, password]
    )
    .then((response) => {
      return response.rows[0]; // Return the newly added user
    })
    .catch((err) => {
      console.error('Error executing addUser query', err.stack);
      return Promise.reject(err);
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const query = `
    SELECT 
      properties.id, 
      properties.title, 
      properties.cost_per_night, 
      properties.thumbnail_photo_url, 
      properties.cover_photo_url, 
      reservations.start_date, 
      reservations.end_date, 
      avg(property_reviews.rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;
  `;

  const values = [guest_id, limit];

  return pool
    .query(query, values)
    .then((result) => result.rows)
    .catch((err) => {
      console.error('Error executing query', err.stack);
      throw err;
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {number} limit The number of results to return.
 * @return {Promise<[{}]>} A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  // 1. Array to hold query parameters
  const queryParams = [];

  // 2. Start the query
  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    LEFT JOIN property_reviews ON properties.id = property_reviews.property_id
  `;

  // 3. Dynamically build the WHERE clause based on the options provided
  const conditions = [];

  // Filter by city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    conditions.push(`city LIKE $${queryParams.length}`);
  }

  // Filter by owner_id
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    conditions.push(`owner_id = $${queryParams.length}`);
  }

  // Filter by price range (minimum and maximum price per night)
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100); // Convert dollars to cents
    queryParams.push(options.maximum_price_per_night * 100); // Convert dollars to cents
    conditions.push(`cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`);
  } else if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100); // Convert dollars to cents
    conditions.push(`cost_per_night >= $${queryParams.length}`);
  } else if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100); // Convert dollars to cents
    conditions.push(`cost_per_night <= $${queryParams.length}`);
  }

  // Filter by minimum rating
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    conditions.push(`avg(property_reviews.rating) >= $${queryParams.length}`);
  }

  // Add the WHERE clause if there are any conditions
  if (conditions.length > 0) {
    queryString += `WHERE ${conditions.join(' AND ')} `;
  }

  // 4. Add the GROUP BY, ORDER BY, and LIMIT clauses
  queryParams.push(limit);
  queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
  `;

  // 5. Log the query for debugging
  console.log(queryString, queryParams);

  // 6. Execute the query
  return pool
    .query(queryString, queryParams)
    .then((res) => res.rows)
    .catch((err) => {
      console.error("Error executing query", err.stack);
      throw err;
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const queryString = `
    INSERT INTO properties (
      owner_id, title, description, thumbnail_photo_url, cover_photo_url,
      cost_per_night, street, city, province, post_code, country,
      parking_spaces, number_of_bathrooms, number_of_bedrooms
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    )
    RETURNING *;
  `;

  const queryParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    Math.round(property.cost_per_night * 100),
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];

  return pool
    .query(queryString, queryParams)
    .then((result) => result.rows[0])
    .catch((err) => {
      console.error('Error executing query', err.stack);
      throw err;
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
