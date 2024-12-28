const express = require("express") 
const app = express() 

const mysql = require("mysql2/promise") 
const cors = require("cors") 

const connection = mysql.createPool({
    host : "127.0.0.1", 
    user: "root", 
    password : "password", 
    database : "supermarket"
})

app.use(express.json()) 
app.use(cors())

app.listen(5000, () => {
    console.log("Server running at http://localhost:5000")
})

// get items api

app.get("/items", async (request, response) => {
    try {
        const selectAllItemQuery = `
            SELECT 
                items.itemId, 
                items.name, 
                items.price, 
                items.quantity, 
                categories.categoryId, 
                categories.category AS categoryName
            FROM 
                items
            INNER JOIN 
                categories 
            ON 
                items.categoryId = categories.categoryId
        `;
        const [dbResponse] = await connection.query(selectAllItemQuery);
        response.status(200).json(dbResponse);
    } catch (e) {
        response.status(400).json(`Error: ${e}`);
        console.log(`Error: ${e}`);
    }
});

// get all items
app.get("/all/items/", async (request, response) => {
    const selectAllIttems = `
        SELECT 
            * 
        FROM 
            items
    `
    const [dbResponse] = await connection.query(selectAllIttems) 
    response.status(200).json(dbResponse)
})

// get sepecfic item
app.get("/items/:id", async (request, response) => {
    const { id } = request.params;
    try {
        const selectedItem = `
            SELECT 
                items.itemId, 
                items.name, 
                items.price, 
                items.quantity, 
                categories.categoryId, 
                categories.category AS categoryName
            FROM 
                items
                INNER JOIN categories ON items.categoryId = categories.categoryId
            WHERE 
                items.itemId = ?;
        `;
        const [dbResponse] = await connection.query(selectedItem, [id]);
        response.status(200).json(dbResponse);
    } catch (e) {
        response.status(400).json(`Error: ${e}`);
    }
});

// create item api 

app.post("/post/items/", async (request, response) => {
    const { name, category, price, quantity } = request.body;

    try {
        // Insert the category directly into the categories table
        const insertCategoryQuery = `
            INSERT INTO categories (category) 
            VALUES (?);`;
        const [insertCategoryResult] = await connection.query(insertCategoryQuery, [category]);

        // Get the inserted categoryId
        const categoryId = insertCategoryResult.insertId;

        // Insert the item into the items table
        const createItemQuery = `
            INSERT INTO items (name, categoryId, price, quantity)
            VALUES (?, ?, ?, ?);
        `;
        const [itemResult] = await connection.query(createItemQuery, [name, categoryId, price, quantity]);

        // Respond with a success message
        response.status(201).json({ message: "Item added successfully", itemId: itemResult.insertId });
    } catch (error) {
        // Catch duplicate category errors or other SQL errors
        if (error.code === "ER_DUP_ENTRY") {
            response.status(400).json({ message: "Category already exists. Use a unique category." });
        } else {
            console.log(`Error: ${error.message}`);
            response.status(500).json({ message: `Error: ${error.message}` });
        }
    }
});


// app.post("/post/items/", async (request, response) => {
//     const { name, category, price, quantity } = request.body;

//     try {
//         let categoryId;

//         // Check if the category already exists
//         const checkCategoryQuery = `
//             SELECT categoryId 
//             FROM categories 
//             WHERE category = ?;`;
//         const [categoryCheckResult] = await connection.query(checkCategoryQuery, [category]);

//         if (categoryCheckResult.length > 0) {
//             // If the category exists, get its categoryId
//             categoryId = categoryCheckResult[0].categoryId;
//         } else {
//             // Insert the new category
//             const insertCategoryQuery = `
//                 INSERT INTO categories (category) 
//                 VALUES (?);`;
//             const [insertCategoryResult] = await connection.query(insertCategoryQuery, [category]);

//             // Get the inserted categoryId
//             categoryId = insertCategoryResult.insertId;
//         }

//         // Insert the item into the items table
//         const createItemQuery = `
//             INSERT INTO items (name, categoryId, price, quantity)
//             VALUES (?, ?, ?, ?);
//         `;
//         const [itemResult] = await connection.query(createItemQuery, [name, categoryId, price, quantity]);

//         // Respond with a success message
//         response.status(201).json({ message: "Item added successfully", itemId: itemResult.insertId });
//     } catch (error) {
//         // Catch any errors and return a failure response
//         console.log(`Error: ${error.message}`);
//         response.status(500).json({ message: `Error: ${error.message}` });
//     }
// });


// app.post("/post/items/", async (request, response) => {
//     const { name, category, price, quantity } = request.body;

//     try {
//         let categoryId;

//         // Ensure the category name is trimmed to avoid mismatched input
//         const trimmedCategory = category.trim(); // Prevent leading/trailing spaces

//         // Check if the category already exists (case-insensitive match)
//         const checkCategoryQuery = `
//             SELECT categoryId
//             FROM categories 
//             WHERE LOWER(category) = LOWER(?);`; // Case-insensitive comparison
//         const [categoryCheckResult] = await connection.query(checkCategoryQuery, [trimmedCategory]);

//         if (categoryCheckResult.length > 0) {
//             // If the category exists, get its categoryId
//             categoryId = categoryCheckResult[0].categoryId;
//         } else {
//             // Insert the new category
//             const insertCategoryQuery = `
//                 INSERT INTO categories (category) 
//                 VALUES (?);`;
//             const [insertCategoryResult] = await connection.query(insertCategoryQuery, [trimmedCategory]);

//             // Get the inserted categoryId
//             categoryId = insertCategoryResult.insertId;
//         }

//         // Insert the item into the items table
//         const createItemQuery = `
//             INSERT INTO items (name, categoryId, price, quantity)
//             VALUES (?, ?, ?, ?);
//         `;
//         const [itemResult] = await connection.query(createItemQuery, [name, categoryId, price, quantity]);

//         // Respond with a success message
//         response.status(201).json({ message: "Item added successfully", itemId: itemResult.insertId });
//     } catch (error) {
//         // Catch any errors and return a failure response
//         console.log(`Error: ${error.message}`);
//         response.status(500).json({ message: `Error: ${error.message}` });
//     }
// });


app.put("/update/:id", async (request, response) => {
    const { name, category, price, quantity } = request.body;
    const { id } = request.params;

    try {
        let categoryId;

        // Check if the category already exists
        const checkCategoryQuery = `SELECT categoryId FROM categories WHERE category = ?;`;
        const [categoryCheckResult] = await connection.query(checkCategoryQuery, [category]);

        if (categoryCheckResult.length > 0) {
            // If the category exists, get its categoryId
            categoryId = categoryCheckResult[0].categoryId;
        } else {
            // Insert the new category if it doesn't exist
            const insertCategoryQuery = `INSERT INTO categories (category) VALUES (?);`;
            const [insertCategoryResult] = await connection.query(insertCategoryQuery, [category]);

            // Get the inserted categoryId
            categoryId = insertCategoryResult.insertId;
        }

        // Update the item in the items table
        const updateItemQuery = `
            UPDATE items 
            SET 
                name = ?, 
                categoryId = ?, 
                price = ?, 
                quantity = ? 
            WHERE 
                itemId = ?;
        `;
        const [updateResult] = await connection.query(updateItemQuery, [name, categoryId, price, quantity, id]);

        response.status(200).json({ message: "Item updated successfully" });
    } catch (e) {
        response.status(400).json({ message: `Error: ${e.message}` });
        console.log(`Error: ${e.message}`);
    }
});


// delete query 
app.delete("/items/:id", async (request, response) => {
    const { id } = request.params;
  
    try {
      const deleteItem = `
        DELETE FROM
          items 
        WHERE 
          itemId = ? 
      `;
  
      const [dbResponse] = await connection.query(deleteItem, [id]);
  
      if (dbResponse.affectedRows > 0) {
        response.status(200).send("Item Removed Successfully");
      } else {
        response.status(404).send("Item not found");
      }
    } catch (error) {
      console.error("Error deleting item:", error.message);
      response.status(500).send("An error occurred while deleting the item.");
    }
  });

// get categories

app.get("/categories", async (request, response) => {
    try{
        const getCategories = `
            SELECT 
                * 
            from 
                categories
        `
        const [dbResponse] = await connection.query(getCategories) 
        response.status(200).json(dbResponse)
    }catch(e){
        response.status(404).json(`Error ${e}`) 
        
    }
})



