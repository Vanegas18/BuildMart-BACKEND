import express from "express";
import cors from "cors";
import { dbConnection } from "./config/db.js";
import categoryProductRoutes from "./routes/categoryProduct/categoryRoutes.js";
import rolesRoutes from "./routes/rolesAndPermissions/rolesRoutes.js";
import permissionsRoutes from "./routes/rolesAndPermissions/permissionsRouter.js";
import userRoutes from "./routes/users/userRoutes.js";
import productRoutes from "./routes/products/productsRoutes.js";
import categorySuppliers from "./routes/categorySuppliers/catSuppliersRoutes.js";
import suppliers from "./routes/suppliers/supplierRoutes.js";

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.paths = {
      categoriesProducts: "/categoriasProductos",
      roles: "/roles",
      permissions: "/permisos",
      users: "/usuarios",
      products: "/productos",
      categoriesSuppliers: "/categoriasProveedores",
      suppliers: "/proveedores",
    };
    this.app.get("/", (req, res) => {
      res.send("<h1>¡BIENVENIDO A LA API DE BUILD MART!</h1>");
    });
    this.conectarDB();
    this.middlewares();
    this.routes();
  }

  async conectarDB() {
    await dbConnection();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  routes() {
    this.app.use(this.paths.categoriesProducts, categoryProductRoutes);
    this.app.use(this.paths.roles, rolesRoutes);
    this.app.use(this.paths.permissions, permissionsRoutes);
    this.app.use(this.paths.users, userRoutes);
    this.app.use(this.paths.products, productRoutes);
    this.app.use(this.paths.categoriesSuppliers, categorySuppliers);
    this.app.use(this.paths.suppliers, suppliers);
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(
        `✅ Servidor corriendo en el puerto http://localhost:${this.port}`
      );
    });
  }
}

export default Server;
