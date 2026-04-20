import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const NOMBRES = [
  "Mateo", "Lucía", "Juan", "Sofía", "Martín", "Camila", "Santiago", "Valentina",
  "Tomás", "Micaela", "Agustín", "Julieta", "Nicolás", "Florencia", "Facundo",
  "Brenda", "Lautaro", "Catalina", "Federico", "Antonella", "Emiliano", "Rocío",
  "Gonzalo", "Milagros", "Franco", "Guadalupe", "Ignacio", "Carolina", "Joaquín",
  "Renata", "Diego", "Malena", "Ezequiel", "Paula",
];

const APELLIDOS = [
  "González", "Rodríguez", "Gómez", "Fernández", "López", "Díaz", "Martínez",
  "Pérez", "García", "Sánchez", "Romero", "Sosa", "Torres", "Álvarez", "Ruiz",
  "Benítez", "Acosta", "Medina", "Herrera", "Suárez", "Aguirre", "Pereyra",
  "Silva", "Molina", "Castro", "Ortiz", "Vega", "Ramos", "Cabrera", "Figueroa",
  "Luna", "Arias", "Bianchi", "Paredes",
];

const CIUDADES = [
  "Mar del Plata", "Buenos Aires", "CABA", "Córdoba", "Rosario", "Mendoza",
  "La Plata", "Tandil", "Bahía Blanca", "Neuquén", "Tucumán", "Salta",
  "Mar del Tuyú", "Villa Gesell", "Pinamar",
];

const MODELOS = [
  "Toyota Corolla", "VW Gol", "Ford Ka", "Chevrolet Onix", "Fiat Cronos",
  "Peugeot 208", "Renault Sandero", "Toyota Hilux", "VW Amarok", "Ford Ranger",
  "Chevrolet Tracker", "Jeep Renegade", "Citroen C3", "Fiat Cronos", "Nissan Frontier",
  "Renault Kangoo", "VW Saveiro", "Ford EcoSport", "Toyota Etios", "Peugeot 2008",
];

const DOMINIOS_EMAIL = ["gmail.com", "hotmail.com", "yahoo.com.ar", "outlook.com"];

const CODIGOS_AREA = ["11", "223", "341", "351", "261", "381", "299", "2914"];

const POSIBLES_TAGS = [
  "butacas", "alfombras", "combo", "cuotas", "mayorista",
  "revendedor", "fiel", "presupuestado",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generarTelefonoUnico(usados: Set<string>): string {
  while (true) {
    const codigo = pick(CODIGOS_AREA);
    let numero = "";
    for (let i = 0; i < 8; i++) numero += randInt(0, 9).toString();
    const tel = `+549${codigo}${numero}`;
    if (!usados.has(tel)) {
      usados.add(tel);
      return tel;
    }
  }
}

function fechaRandomUltimos90Dias(): string {
  const ahora = Date.now();
  const hace90 = ahora - 90 * 24 * 60 * 60 * 1000;
  const ts = randInt(hace90, ahora);
  return new Date(ts).toISOString();
}

type ContactoInsert = {
  nombre: string;
  telefono: string;
  email: string | null;
  tipo: "cliente" | "lead_calificado";
  vehiculo: string | null;
  ciudad: string | null;
  etiquetas: string[];
  ultima_interaccion: string | null;
};

function generarContacto(tipo: "cliente" | "lead_calificado", usados: Set<string>): ContactoInsert {
  const nombre = pick(NOMBRES);
  const apellido = pick(APELLIDOS);
  const nombreCompleto = `${nombre} ${apellido}`;

  const email = Math.random() < 0.8
    ? `${stripAccents(nombre).toLowerCase()}.${stripAccents(apellido).toLowerCase()}${randInt(1, 999)}@${pick(DOMINIOS_EMAIL)}`
    : null;

  const vehiculo = Math.random() < 0.9
    ? `${pick(MODELOS)} ${randInt(2015, 2024)}`
    : null;

  const cantTags = randInt(0, 3);
  const etiquetas: string[] = [];
  const tagsDisponibles = [...POSIBLES_TAGS];
  for (let i = 0; i < cantTags; i++) {
    const idx = randInt(0, tagsDisponibles.length - 1);
    etiquetas.push(tagsDisponibles.splice(idx, 1)[0]);
  }

  const ultimaInteraccion = Math.random() < 0.8 ? fechaRandomUltimos90Dias() : null;

  return {
    nombre: nombreCompleto,
    telefono: generarTelefonoUnico(usados),
    email,
    tipo,
    vehiculo,
    ciudad: pick(CIUDADES),
    etiquetas,
    ultima_interaccion: ultimaInteraccion,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const expected = process.env.SEED_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { count, error: countError } = await admin
    .from("contactos")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { ok: false, message: "Ya hay contactos en la DB, seed cancelado" },
      { status: 409 }
    );
  }

  const telefonosUsados = new Set<string>();
  const contactos: ContactoInsert[] = [];
  for (let i = 0; i < 60; i++) contactos.push(generarContacto("cliente", telefonosUsados));
  for (let i = 0; i < 40; i++) contactos.push(generarContacto("lead_calificado", telefonosUsados));

  const mezclados = shuffle(contactos);

  const { error: insertError } = await admin.from("contactos").insert(mezclados);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: mezclados.length });
}
