const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require('cors');
const PORT = 8000;
const app = express();

const { User, syncDatabase } = require("./model/User");

const corsOptions = {
  origin: 'http://localhost:3000', // Allow requests from this origin
  methods: 'GET,POST,PUT,DELETE', // Allow only these HTTP methods
  allowedHeaders: 'Content-Type,Authorization', // Allow only these headers 
  credentials: true, // Allow credentials
};

// Middleware to parse JSON data
app.use(express.json());
// so that our app can understand and interact with cookies
app.use(cookieParser());
// to handle cors error
app.use(cors(corsOptions));

syncDatabase();

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, password, email } = req.body;
    // if the data doesnt exists
    if (!(name && password && email)) {
      res.status(400).send("All fields are compulsory!");
    }
    // check if user exists
    const ExistingUser = await User.findOne({ where: { email } });
    if (ExistingUser) {
      res.status(409).send("User with this email already exists!");
    } else {
      //encrypt the password
      const encPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: encPassword });

      // generate a token for user
      // when the token is verified then it only shows the id and email for any operation
      // does not give away the password
      const token = jwt.sign({ id: user.pid, email }, "shhhh", {
        // the shhh is a secret key that only the server knows
        // it is used to sign and verify the token
        expiresIn: "2d",
      });

      user.token = token;
      user.password = undefined;
    
      // res.send() sends the data as json in express but this one is more clear
      res.status(200).json(user); //converted to json string by express before sending it
      // send the data as json
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password)) {
      res.status(400).send("Incomplete data!");
    } else {
      const user = await User.findOne( {where: { email: email }});
      if (!user) {
        res.status(404).send("User does not exist");
      }
      const pass = await bcrypt.compare(password, user.password);
      if (user && pass) {
        const token = jwt.sign({ id: user.pid }, "shhhh");
        user.token = token;
        user.password = undefined;

        // send token in user cookie
        const options = {
          expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), //data.now + 3days converted to millisec
          httpOnly: true, // can only be accessed by the server
        };
        // the name of cookie is token
        res.status(200).cookie("token", token, options).json({
          success: true,
          token,
          user,
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

app.put("/api/auth/profile", async(req,res) => {
  try {
    console.log('request starts from here watch out:', req);
    const authHeader = req.headers['authorization'];
    const email = req.body.email;
    const name = req.body.name;
    console.log(authHeader)
    console.log(req.body)
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'shhhh');
    const [updatedRowsCount] = await User.update(
      { email: email, name: name },
      {
        where: {
          pid: decoded.id,
        },
      },
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'User not found or not authorized' });
    }

    // Fetch the updated user from the database
    var updatedUser = await User.findOne({ where: { pid: decoded.id } });
    console.log('updatedUser',updatedUser);
    updatedUser = { ...updatedUser.toJSON(), token: token }; // converting sequelize model instance to a plain js object
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
  }
})

app.delete("/api/auth/profile", async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log(authHeader)
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'shhhh');
    console.log(decoded);
    await User.destroy({
      where: {
        pid: decoded.id,
      },
    });
    res.status(200).send('Account deletion successful!');
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
