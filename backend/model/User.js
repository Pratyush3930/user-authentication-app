const { sequelize } = require("../sequelizedb");
const { DataTypes } = require("sequelize");
const User = sequelize.define("User", {
  // Define model attributes
  pid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true 
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

async function syncDatabase() {
  try {
    await User.sync({ alter: true }); // Use { force: true } to drop existing tables
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Unable to synchronize database:", error);
  }
}

module.exports = {
  User,
  syncDatabase,
};
