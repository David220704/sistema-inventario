/**
 * JWT Auth Guard
 *
 * Guard de Passport que valida tokens JWT en las peticiones.
 * Se aplica a nivel de controller para proteger todas las rutas.
 *
 * Uso:
 *   @Controller("users")
 *   @UseGuards(JwtAuthGuard)  // Todas las rutas requieren JWT
 *   export class UsersController {}
 *
 * El guard extrae el token del header Authorization: Bearer <token>
 * y lo valida usando JwtStrategy.
 *
 * @module JwtAuthGuard
 */

import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
