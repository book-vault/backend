
# Book Vault API

This is a simple Express.js API that connects to a MySQL database to manage books. It supports operations such as getting a list of books, adding new books, updating existing books, and deleting books.

## Features

- **Get Books**: Retrieve a list of all books in the database.
- **Add Books**: Add a new book with a name, publisher, and date.
- **Update Books**: Update an existing book by ID.
- **Delete Books**: Delete a book by ID.

## Requirements

- Node.js (version 14.x or later)
- MySQL server
- Docker (optional, if you plan to run it in a container)
- A `.env` file with the necessary environment variables (explained below)

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/book-vault/backend.git
cd backend
```

### 2. Install Dependencies

Ensure that you have `Node.js` installed. Then run:

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory of the project with the following variables:

```
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=bvDB
DATABASE_ENDPOINT=localhost
MYSQL_PORT=3306
PORT=3000
```

You can modify these values based on your MySQL setup. For example, if you're using a cloud database or Docker, adjust the `DATABASE_ENDPOINT` accordingly.

### 4. Start MySQL Database

Ensure you have MySQL running either locally or through a Docker container. If you wish to use Docker, you can use the following command to start a MySQL instance:

```bash
docker run --name mysql-db -e MYSQL_ROOT_PASSWORD=yourpassword -e MYSQL_DATABASE=bvDB -p 3306:3306 -d mysql:latest
```

### 5. Start the Server

To start the server, run:

```bash
npm start
```

By default, the server will run on `http://localhost:3000`.

### 6. API Endpoints

| Method | Endpoint          | Description                 |
|--------|-------------------|-----------------------------|
| GET    | `/api/books`       | Get all books               |
| POST   | `/api/books`       | Add a new book              |
| PUT    | `/api/books/:id`   | Update a book by ID         |
| DELETE | `/api/books/:id`   | Delete a book by ID         |

#### Example of Adding a Book

POST request to `/api/books` with the following body:

```json
{
  "name": "The Great Gatsby",
  "publisher": "Scribner",
  "date": "1925-04-10"
}
```

### 7. Docker Support

You can build and run this API in a Docker container. To do so, create a `Dockerfile` like this:

```Dockerfile
# Use official Node.js image
FROM node:18

# Expose port 3000
EXPOSE 3000

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json /app
RUN npm install

# Copy all other files
COPY . /app

# Start the server
CMD ["node", "server.js"]
```

Then, build and run the Docker image:

```bash
docker build -t book-vault-api .
docker run -d -p 3000:3000 --env-file .env book-vault-api
```

### 8. Error Handling and Retrying Connection

The application attempts to reconnect to the database if the initial connection fails. If the connection keeps failing, the application will exit after multiple retries.

### 9. Contributions

Feel free to open issues or submit pull requests if you find any bugs or have suggestions for improvements.

### 10. License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
