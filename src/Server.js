import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { dbConnection } from "./config/db.js";
import categoryProduct from "./routes/categoryProduct/categoryRoutes.js";
import categorySuppliers from "./routes/categorySuppliers/catSuppliersRoutes.js";
import suppliers from "./routes/suppliers/supplierRoutes.js";
import rolesRoutes from "./routes/rolesAndPermissions/rolesRoutes.js";
import permissionsRoutes from "./routes/rolesAndPermissions/permissionsRouter.js";
import userRoutes from "./routes/users/userRoutes.js";
import productRoutes from "./routes/products/productsRoutes.js";
import buysRoutes from "./routes/buys/buysRoutes.js";
import orderRoutes from "./routes/orders/ordersRoutes.js";
import saleRoutes from "./routes/sales/saleRoutes.js";
import clientRoutes from "./routes/customers/clientRoutes.js";
import notificationsRoutes from "./routes/notificaciones.js";
import { procesarOfertas } from "./controllers/products/ofertas.js";

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
      notificaciones: "/notificaciones",
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
        origin: [
          "http://localhost:5173",
          "https://buildmart-back-billowing-feather-8375.fly.dev",
          "https://build-bhzqz1dka-vanegas18s-projects.vercel.app/login",
        ],
        credentials: true,
      })
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  routes() {
    this.app.use(this.paths.categoriesProducts, categoryProduct);
    this.app.use(this.paths.categoriesSuppliers, categorySuppliers);
    this.app.use(this.paths.suppliers, suppliers);
    this.app.use(this.paths.roles, rolesRoutes);
    this.app.use(this.paths.permissions, permissionsRoutes);
    this.app.use(this.paths.users, userRoutes);
    this.app.use(this.paths.products, productRoutes);
    this.app.use(this.paths.compras, buysRoutes);
    this.app.use(this.paths.ordenes, orderRoutes);
    this.app.use(this.paths.ventas, saleRoutes);
    this.app.use(this.paths.clientes, clientRoutes);
    this.app.use(this.paths.notificaciones, notificationsRoutes);
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(
        `✅ Servidor corriendo en el puerto http://localhost:${this.port}`
      );
      procesarOfertas.start();
    });
  }
}

export default Server;
