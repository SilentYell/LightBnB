-- List the most visited cities and number of reservations
SELECT p.city, COUNT(r.id) AS total_reservations
FROM reservations r
JOIN properties p ON r.property_id = p.id
GROUP BY p.city
ORDER BY total_reservations DESC;