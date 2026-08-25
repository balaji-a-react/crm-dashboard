import { deleteCustomer, getCustomerById, updateCustomer } from "@/lib/mock-data";
import type { CustomerUpdates } from "@/lib/types";

// Same dependency-free validators as the collection route.
function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // E.164: separators allowed, but the digit count must be 7–15.
  if (!/^[\d\s()+.-]*$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

// ---------------------------------------------------------------------------
// GET /api/customers/[id]
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Next 15+/16: params is a Promise in handlers
  const customer = getCustomerById(id);

  if (!customer) {
    return Response.json({ error: "Customer not found." }, { status: 404 });
  }
  return Response.json(customer);
}

// ---------------------------------------------------------------------------
// PATCH /api/customers/[id] -- partial update
// ---------------------------------------------------------------------------

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Whitelist updatable fields so clients can't inject `id`/`createdAt`.
  const updates: CustomerUpdates = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.email === "string" && body.email.trim()) {
    if (!isValidEmail(body.email.trim())) {
      return Response.json({ error: "Invalid email address." }, { status: 400 });
    }
    updates.email = body.email.trim();
  }
  if (typeof body.phone === "string" && body.phone.trim()) {
    if (!isValidPhone(body.phone.trim())) {
      return Response.json({ error: "Invalid phone number." }, { status: 400 });
    }
    updates.phone = body.phone.trim();
  }
  if (typeof body.company === "string") updates.company = body.company.trim();
  if (body.status === "active" || body.status === "inactive") {
    updates.status = body.status;
  }
  if (typeof body.lastContactDate === "string") {
    updates.lastContactDate = body.lastContactDate;
  }
  if (typeof body.notes === "string" || body.notes === undefined) {
    updates.notes = body.notes as string | undefined;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json(
      { error: "No valid fields provided to update." },
      { status: 400 }
    );
  }

  const customer = updateCustomer(id, updates);
  if (!customer) {
    return Response.json({ error: "Customer not found." }, { status: 404 });
  }
  return Response.json(customer);
}

// ---------------------------------------------------------------------------
// DELETE /api/customers/[id]
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!deleteCustomer(id)) {
    return Response.json({ error: "Customer not found." }, { status: 404 });
  }
  // 204 No Content -- successful deletion has no body.
  return new Response(null, { status: 204 });
}
