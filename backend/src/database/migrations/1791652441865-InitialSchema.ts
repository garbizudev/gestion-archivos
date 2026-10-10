import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791652441865 implements MigrationInterface {
  name = 'InitialSchema1791652441865';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."role_code" AS ENUM('STANDARD', 'AREA_HEAD', 'MANAGER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" SMALLSERIAL NOT NULL, "code" "public"."role_code" NOT NULL, "name" character varying(60) NOT NULL, "description" text, CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c" UNIQUE ("code"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" character varying(150) NOT NULL, "full_name" character varying(150) NOT NULL, "password_hash" character varying(100) NOT NULL, "role_id" smallint NOT NULL, "area_id" uuid, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "areas" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8c2ad80240e18fcac9e7c526311" UNIQUE ("name"), CONSTRAINT "PK_5110493f6342f34c978c084d0d6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "original_name" character varying(255) NOT NULL, "storage_key" character varying(255) NOT NULL, "mime_type" character varying(150) NOT NULL, "size_bytes" bigint NOT NULL, "checksum_sha256" character(64) NOT NULL, "owner_id" uuid NOT NULL, "area_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by_id" uuid, CONSTRAINT "UQ_e916afbf2015d561fd0842ff898" UNIQUE ("storage_key"), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4bc1db1f4f34ec9415acd88afd" ON "files"  ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1370d5e617bc7d0a0078f84f8c" ON "files"  ("area_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_action" AS ENUM('LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'UPLOAD', 'DOWNLOAD', 'DELETE', 'ACCESS_DENIED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" BIGSERIAL NOT NULL, "action" "public"."audit_action" NOT NULL, "actor_id" uuid, "actor_area_id" uuid, "file_id" uuid, "file_name" character varying(255), "ip_address" character varying(45), "user_agent" character varying(255), "details" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_177183f29f438c488b5e8510cd" ON "audit_logs"  ("actor_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f44bf16747a1e473aa64a80819" ON "audit_logs"  ("actor_area_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aeb1c55f12137abc1913fa7a80" ON "audit_logs"  ("file_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2cd10fda8276bb995288acfbfb" ON "audit_logs"  ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "manager_areas" ("manager_id" uuid NOT NULL, "area_id" uuid NOT NULL, CONSTRAINT "PK_c7f07dd764dde7b146883945edf" PRIMARY KEY ("manager_id", "area_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0828c500a005515fa09b0aacd6" ON "manager_areas"  ("manager_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9dd7c926b953ed4dbbf5a7afde" ON "manager_areas"  ("area_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_bb8cbcf3ff9a3a987b63a763139" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_4bc1db1f4f34ec9415acd88afdb" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_1370d5e617bc7d0a0078f84f8c0" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_44b230dec73af3d1c595e1177d9" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_177183f29f438c488b5e8510cdb" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_aeb1c55f12137abc1913fa7a80c" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "manager_areas" ADD CONSTRAINT "FK_0828c500a005515fa09b0aacd65" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "manager_areas" ADD CONSTRAINT "FK_9dd7c926b953ed4dbbf5a7afde3" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "manager_areas" DROP CONSTRAINT "FK_9dd7c926b953ed4dbbf5a7afde3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "manager_areas" DROP CONSTRAINT "FK_0828c500a005515fa09b0aacd65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_aeb1c55f12137abc1913fa7a80c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_177183f29f438c488b5e8510cdb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_44b230dec73af3d1c595e1177d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_1370d5e617bc7d0a0078f84f8c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_4bc1db1f4f34ec9415acd88afdb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_bb8cbcf3ff9a3a987b63a763139"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9dd7c926b953ed4dbbf5a7afde"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0828c500a005515fa09b0aacd6"`,
    );
    await queryRunner.query(`DROP TABLE "manager_areas"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2cd10fda8276bb995288acfbfb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aeb1c55f12137abc1913fa7a80"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f44bf16747a1e473aa64a80819"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_177183f29f438c488b5e8510cd"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_action"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1370d5e617bc7d0a0078f84f8c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4bc1db1f4f34ec9415acd88afd"`,
    );
    await queryRunner.query(`DROP TABLE "files"`);
    await queryRunner.query(`DROP TABLE "areas"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TYPE "public"."role_code"`);
  }
}
