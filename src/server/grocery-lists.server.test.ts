import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRecipeToGroceryList,
  removeRecipeFromGroceryList,
} from "./grocery-lists.server";

type Result = { data: unknown; error: unknown };

// Shared, ordered log of every call on every fake client: "<client>:<call>".
let log: string[] = [];

/**
 * Minimal Supabase stand-in: every query-builder method chains and awaiting
 * resolves to the canned result for that table / RPC.
 */
function fakeSupabase(
  name: string,
  opts: {
    tables?: Record<string, Result>;
    rpcs?: Record<string, Result>;
    user?: { id: string } | null;
  } = {},
) {
  const rpcArgs: Record<string, unknown> = {};
  const client = {
    from(table: string) {
      const result = opts.tables?.[table] ?? { data: null, error: null };
      const builder: object = new Proxy(
        {},
        {
          get(_, prop) {
            if (prop === "then") {
              return (resolve: (r: Result) => unknown) => resolve(result);
            }
            return () => {
              log.push(`${name}:${table}.${String(prop)}`);
              return builder;
            };
          },
        },
      );
      return builder;
    },
    async rpc(fn: string, args: unknown) {
      log.push(`${name}:rpc:${fn}`);
      rpcArgs[fn] = args;
      return opts.rpcs?.[fn] ?? { data: null, error: null };
    },
    auth: {
      async getUser() {
        return { data: { user: opts.user ?? null }, error: null };
      },
    },
  };
  return { client: client as unknown as SupabaseClient, rpcArgs };
}

// The admin factory is mocked for every test; getServerClient for the route tests.
const serverClient = vi.hoisted(() => ({ current: null as unknown }));
const adminFactory = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase.server", () => ({
  getServerClient: () => ({
    supabase: serverClient.current,
    headers: new Headers(),
  }),
}));
vi.mock("@/server/supabase-admin.server", () => ({
  createSupabaseAdminClient: adminFactory,
}));

beforeEach(() => {
  log = [];
  adminFactory.mockReset();
});

// A member's private recipe: the caller's RLS hides recipes(servings) (null),
// only the admin client sees it.
const adminTables = {
  grocery_list_recipes: {
    data: [
      { recipe_id: "r1", servings_multiplier: 1, recipes: { servings: 2 } },
    ],
    error: null,
  },
  recipe_ingredients: {
    data: [
      {
        recipe_id: "r1",
        ingredient_id: 7,
        unit_amount: 2,
        unit_id: "g",
        note: null,
      },
    ],
    error: null,
  },
  units: {
    data: [
      {
        id: "g",
        name: "gram",
        type: "weight",
        system: "metric",
        base_conversion_factor: 1,
      },
    ],
    error: null,
  },
};
const userTables = {
  grocery_list_recipes: {
    data: [{ recipe_id: "r1", servings_multiplier: 1, recipes: null }],
    error: null,
  },
};

/** Make createSupabaseAdminClient() return a fake admin that sees the private recipe. */
function fakeAdmin(rpcs?: Record<string, Result>) {
  const admin = fakeSupabase("admin", {
    tables: adminTables,
    rpcs: { begin_grocery_list_regeneration: { data: 42, error: null }, ...rpcs },
  });
  adminFactory.mockImplementation(() => {
    log.push("admin:created");
    return admin.client;
  });
  return admin;
}

describe("grocery list recipe mutations", () => {
  it("adds the link on the user client and regenerates on the admin client", async () => {
    const user = fakeSupabase("user", { tables: userTables });
    const admin = fakeAdmin();

    await addRecipeToGroceryList(user.client, {
      listId: "l1",
      recipeId: "r1",
    });

    expect(log.filter((c) => c.startsWith("user:"))).toEqual([
      "user:grocery_list_recipes.upsert",
    ]);
    expect(log).toContain("admin:rpc:replace_generated_grocery_list_items");
    // Regen doesn't throw for the admin-only-visible recipe and writes its items.
    expect(admin.rpcArgs.replace_generated_grocery_list_items).toMatchObject({
      p_list_id: "l1",
      p_items: [expect.objectContaining({ ingredient_id: 7 })],
      p_generation: 42,
    });
    // The ticket must be taken before inputs are read, or a concurrent
    // regeneration's newer snapshot could be overwritten by this stale one.
    expect(log.indexOf("admin:rpc:begin_grocery_list_regeneration")).toBeLessThan(
      log.indexOf("admin:grocery_list_recipes.select"),
    );
  });

  it("does not read inputs or write when taking the ticket fails", async () => {
    const user = fakeSupabase("user", { tables: userTables });
    fakeAdmin({
      begin_grocery_list_regeneration: { data: null, error: { code: "XX000" } },
    });

    await expect(
      addRecipeToGroceryList(user.client, { listId: "l1", recipeId: "r1" }),
    ).rejects.toMatchObject({ code: "XX000" });
    expect(log).not.toContain("admin:grocery_list_recipes.select");
    expect(log).not.toContain("admin:rpc:replace_generated_grocery_list_items");
  });

  it("treats a skipped write (a later regeneration already wrote) as success", async () => {
    const user = fakeSupabase("user", { tables: userTables });
    fakeAdmin({
      replace_generated_grocery_list_items: { data: false, error: null },
    });

    await expect(
      addRecipeToGroceryList(user.client, { listId: "l1", recipeId: "r1" }),
    ).resolves.toBeUndefined();
  });

  it("removes the link on the user client and regenerates on the admin client", async () => {
    const user = fakeSupabase("user", { tables: userTables });
    const admin = fakeAdmin();

    await removeRecipeFromGroceryList(user.client, {
      listId: "l1",
      recipeId: "r1",
    });

    expect(log.filter((c) => c.startsWith("user:"))).toEqual([
      "user:grocery_list_recipes.delete",
      "user:grocery_list_recipes.eq",
      "user:grocery_list_recipes.eq",
    ]);
    expect(admin.rpcArgs.replace_generated_grocery_list_items).toMatchObject({
      p_generation: 42,
    });
  });

  it("does not regenerate when the link write fails", async () => {
    const user = fakeSupabase("user", {
      tables: {
        grocery_list_recipes: { data: null, error: { code: "42501" } },
      },
    });
    fakeAdmin();

    await expect(
      addRecipeToGroceryList(user.client, { listId: "l1", recipeId: "r1" }),
    ).rejects.toThrow("Recipe not found");
    expect(log.some((c) => c.startsWith("admin:"))).toBe(false);
  });
});

async function callAction(
  action: (args: never) => Promise<unknown>,
  method: string,
  body?: unknown,
) {
  const request = new Request("http://localhost/api", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  try {
    return await action({ request, params: { listId: "l1" } } as never);
  } catch (thrown) {
    return thrown;
  }
}

const statusOf = (result: unknown) =>
  (result as { init?: { status?: number } })?.init?.status;

describe("grocery list API routes", () => {
  it("/recipes: 404 for a stranger, before any admin client exists", async () => {
    const { action } = await import("@/routes/api.grocery-list-recipes");
    serverClient.current = fakeSupabase("user", {
      user: { id: "stranger" },
      tables: { grocery_lists: { data: null, error: null } },
    }).client;

    const result = await callAction(action, "POST", { recipeId: "r1" });

    expect(statusOf(result)).toBe(404);
    expect(adminFactory).not.toHaveBeenCalled();
  });

  it("/recipes: member's add checks access, then writes, then regenerates as admin", async () => {
    const { action } = await import("@/routes/api.grocery-list-recipes");
    serverClient.current = fakeSupabase("user", {
      user: { id: "member" },
      tables: {
        ...userTables,
        grocery_lists: { data: { id: "l1" }, error: null },
      },
    }).client;
    fakeAdmin();

    const result = await callAction(action, "POST", { recipeId: "r1" });

    expect(result).toMatchObject({ data: { ok: true } });
    const accessCheck = log.indexOf("user:grocery_lists.select");
    expect(accessCheck).toBeGreaterThanOrEqual(0);
    expect(accessCheck).toBeLessThan(log.indexOf("admin:created"));
    expect(log.indexOf("user:grocery_list_recipes.upsert")).toBeLessThan(
      log.indexOf("admin:rpc:replace_generated_grocery_list_items"),
    );
  });

  it("/recipes: a recipe the caller can't see (42501) is a 404, not a 500", async () => {
    const { action } = await import("@/routes/api.grocery-list-recipes");
    serverClient.current = fakeSupabase("user", {
      user: { id: "member" },
      tables: {
        grocery_lists: { data: { id: "l1" }, error: null },
        grocery_list_recipes: { data: null, error: { code: "42501" } },
      },
    }).client;
    fakeAdmin();

    expect(statusOf(await callAction(action, "POST", { recipeId: "r1" }))).toBe(
      404,
    );
    expect(adminFactory).not.toHaveBeenCalled();
  });

  it("/recipes: a regeneration failure after the link write is not mapped to 404", async () => {
    const { action } = await import("@/routes/api.grocery-list-recipes");
    serverClient.current = fakeSupabase("user", {
      user: { id: "member" },
      tables: { grocery_lists: { data: { user_id: "owner" }, error: null } },
    }).client;
    fakeAdmin({
      replace_generated_grocery_list_items: {
        data: null,
        error: { code: "42501" },
      },
    });

    const result = await callAction(action, "POST", { recipeId: "r1" });
    expect(statusOf(result)).toBeUndefined();
    expect(result).toMatchObject({ code: "42501" });
  });

  it("/items: 404 for a stranger", async () => {
    const { action } = await import("@/routes/api.grocery-list-items");
    serverClient.current = fakeSupabase("user", {
      user: { id: "stranger" },
      tables: { grocery_lists: { data: null, error: null } },
    }).client;

    const result = await callAction(action, "POST", {
      ingredientName: "salt",
      quantity: 1,
      unitName: "",
    });

    expect(statusOf(result)).toBe(404);
    expect(log).not.toContain("user:grocery_list_items.insert");
  });

  it("/share: 403 for a member, 404 for a stranger, token for the owner", async () => {
    const { action } = await import("@/routes/api.grocery-list-share");
    const asUser = (id: string, list: unknown) =>
      fakeSupabase("user", {
        user: { id },
        tables: { grocery_lists: { data: list, error: null } },
      }).client;

    serverClient.current = asUser("member", { user_id: "owner" });
    expect(statusOf(await callAction(action, "POST"))).toBe(403);
    expect(log).not.toContain("user:grocery_lists.update");

    serverClient.current = asUser("stranger", null);
    expect(statusOf(await callAction(action, "DELETE"))).toBe(404);

    serverClient.current = asUser("owner", { user_id: "owner" });
    const created = await callAction(action, "POST");
    expect(
      (created as { data: { shareToken: string } }).data.shareToken,
    ).toMatch(/^[0-9a-f-]{36}$/);
    expect(await callAction(action, "DELETE")).toMatchObject({
      data: { shareToken: null },
    });
  });
});
