import 'reflect-metadata';
import { hash } from 'bcrypt';
import { EntityManager } from 'typeorm';
import dataSource from '../data-source';
import { Area } from '../../areas/entities/area.entity';
import { Role } from '../../roles/entities/role.entity';
import { RoleCode } from '../../roles/role-code.enum';
import { User } from '../../users/entities/user.entity';


const BCRYPT_ROUNDS = 12;

const ROLES: Pick<Role, 'code' | 'name' | 'description'>[] = [
  {
    code: RoleCode.STANDARD,
    name: 'Usuario estándar',
    description:
      'Carga, visualiza, descarga y elimina únicamente sus propios archivos.',
  },
  {
    code: RoleCode.AREA_HEAD,
    name: 'Jefe de área',
    description:
      'Visualiza y descarga los archivos de su área; elimina solo los propios.',
  },
  {
    code: RoleCode.MANAGER,
    name: 'Gerente',
    description:
      'Visualiza, descarga y elimina archivos de las áreas a su cargo y consulta su historial.',
  },
  {
    code: RoleCode.ADMIN,
    name: 'Administrador',
    description:
      'Acceso total a archivos e historial; administra usuarios, roles y áreas.',
  },
];

const AREAS: Pick<Area, 'name' | 'description'>[] = [
  { name: 'Tecnología', description: 'Desarrollo e infraestructura.' },
  { name: 'Finanzas', description: 'Contabilidad y tesorería.' },
  { name: 'Recursos Humanos', description: 'Gestión del personal.' },
];

interface SeedUser {
  email: string;
  fullName: string;
  role: RoleCode;
  area: string | null;
  managedAreas?: string[];
}

const USERS: SeedUser[] = [
  {
    email: 'admin@example.com',
    fullName: 'Ana Administradora',
    role: RoleCode.ADMIN,
    area: null,
  },
  {
    email: 'gerente@example.com',
    fullName: 'Gonzalo Gerente',
    role: RoleCode.MANAGER,
    area: 'Tecnología',
    managedAreas: ['Tecnología', 'Finanzas'],
  },
  {
    email: 'jefe.tec@example.com',
    fullName: 'Julia Jefa de Tecnología',
    role: RoleCode.AREA_HEAD,
    area: 'Tecnología',
  },
  {
    email: 'usuario.tec@example.com',
    fullName: 'Tomás Técnico',
    role: RoleCode.STANDARD,
    area: 'Tecnología',
  },
  {
    email: 'usuario.fin@example.com',
    fullName: 'Fernanda Finanzas',
    role: RoleCode.STANDARD,
    area: 'Finanzas',
  },
  {
    email: 'usuario.rrhh@example.com',
    fullName: 'Ricardo Recursos Humanos',
    role: RoleCode.STANDARD,
    area: 'Recursos Humanos',
  },
];

async function seedRoles(manager: EntityManager): Promise<Map<RoleCode, Role>> {
  const repo = manager.getRepository(Role);
  const result = new Map<RoleCode, Role>();
  for (const data of ROLES) {
    let role = await repo.findOneBy({ code: data.code });
    if (!role) {
      role = await repo.save(repo.create(data));
      console.log(`  + rol ${data.code}`);
    }
    result.set(role.code, role);
  }
  return result;
}

async function seedAreas(manager: EntityManager): Promise<Map<string, Area>> {
  const repo = manager.getRepository(Area);
  const result = new Map<string, Area>();
  for (const data of AREAS) {
    let area = await repo.findOneBy({ name: data.name });
    if (!area) {
      area = await repo.save(repo.create(data));
      console.log(`  + área ${data.name}`);
    }
    result.set(area.name, area);
  }
  return result;
}

async function seedUsers(
  manager: EntityManager,
  roles: Map<RoleCode, Role>,
  areas: Map<string, Area>,
  password: string,
): Promise<void> {
  const repo = manager.getRepository(User);
  const passwordHash = await hash(password, BCRYPT_ROUNDS);

  for (const data of USERS) {
    if (await repo.existsBy({ email: data.email })) {
      console.log(`  = usuario ${data.email} (ya existe)`);
      continue;
    }
    await repo.save(
      repo.create({
        email: data.email,
        fullName: data.fullName,
        passwordHash,
        role: roles.get(data.role)!,
        area: data.area ? areas.get(data.area)! : null,
        managedAreas: (data.managedAreas ?? []).map((name) => areas.get(name)!),
      }),
    );
    console.log(`  + usuario ${data.email} (${data.role})`);
  }
}

async function run(): Promise<void> {
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      'Define SEED_DEMO_PASSWORD (mínimo 8 caracteres) en el .env para crear los usuarios de prueba.',
    );
  }

  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      console.log('Sembrando datos...');
      const roles = await seedRoles(manager);
      const areas = await seedAreas(manager);
      await seedUsers(manager, roles, areas, password);
    });
    console.log('Seed completado.');
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error('Error en el seed:', error);
  process.exit(1);
});
