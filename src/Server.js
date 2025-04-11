import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { dbConnection } from "./config/db.js";
import categoryProduct from "./routes/categoryProduct/categoryRoutes.js";
import categorySuppliers from "./routes/categorySuppliers/catSuppliersRoutes.js";
import suppliers from "./routes/suppliers/supplierRoutes.js";
import categoryProductRoutes from "./routes/categoryProduct/categoryRoutes.js";
import rolesRoutes from "./routes/rolesAndPermissions/rolesRoutes.js";
import permissionsRoutes from "./routes/rolesAndPermissions/permissionsRouter.js";
import userRoutes from "./routes/users/userRoutes.js";
import productRoutes from "./routes/products/productsRoutes.js";
import buysRoutes from "./routes/buys/buysRoutes.js";
import orderRoutes from "./routes/orders/ordersRoutes.js";
import saleRoutes from "./routes/sales/saleRoutes.js";
import clientRoutes from "./routes/customers/clientRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.paths = {
      categoriesProducts: "/categoriasProductos",
      categoriesSuppliers: "/categoriasProveedores",
      suppliers: "/proveedores",
      roles: "/roles",
      permissions: "/permisos",
      users: "/usuarios",
      products: "/productos",
      compras: "/compras",
      clientes: "/clientes",
      ordenes: "/pedidos",
      ventas: "/ventas",
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
    this.app.use(
      cors({
        origin: "http://localhost:5173",
        credentials: true,
      })
    );
    this.app.use(express.json());
    this.app.use(cookieParser());
    // Middleware de logging para debugging
    this.app.use((req, res, next) => {
      console.log("📝 Request:", {
        method: req.method,
        path: req.path,
        body: req.body,
        files: req.files,
        headers: req.headers,
      });
      next();
    });
  }

  routes() {
    this.app.use(this.paths.categoriesProducts, categoryProduct);
    this.app.use(this.paths.categoriesSuppliers, categorySuppliers);
    this.app.use(this.paths.suppliers, suppliers);
    this.app.use(this.paths.categoriesProducts, categoryProductRoutes);
    this.app.use(this.paths.roles, rolesRoutes);
    this.app.use(this.paths.permissions, permissionsRoutes);
    this.app.use(this.paths.users, userRoutes);
    this.app.use(this.paths.products, productRoutes);
    this.app.use(this.paths.compras, buysRoutes);
    this.app.use(this.paths.ordenes, orderRoutes);
    this.app.use(this.paths.ventas, saleRoutes);
    this.app.use(this.paths.clientes, clientRoutes);
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
