# Next.js Supabase E-commerce Site

This is a small-scale e-commerce application built with Next.js, Supabase, and integrated with Toss Payments for handling transactions.

## Features

-   **User Authentication**: Secure user login, signup, and logout functionality using Supabase Auth.
-   **Product Management**: Authenticated users can add, view, and manage products.
-   **Product Listing**: Display a list of available products on the home page.
-   **Product Detail Page**: View detailed information for individual products.
-   **Shopping Cart**: Add products to a cart, view cart contents, and calculate total price.
-   **Checkout Process**: Integrated with Toss Payments for secure payment processing (Card, Bank Transfer, Virtual Account).
-   **Order History**: View a list of past orders with detailed order items.
-   **Responsive Design**: Modern and clean UI using Tailwind CSS.

## Technologies Used

-   **Frontend**: Next.js (App Router), React, TypeScript
-   **Styling**: Tailwind CSS
-   **Backend/Database/Auth**: Supabase
-   **Payment Gateway**: Toss Payments

## Setup Instructions

### 1. Clone the Repository

```bash
git clone [YOUR_REPOSITORY_URL]
cd nextjs-supabase-ecommerce
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Supabase Project Setup

1.  **Create a Supabase Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Get API Keys**: From your Supabase project settings, navigate to "API" and copy your `Project URL` and `anon public` key.
3.  **Create Tables**: Create the following tables in your Supabase project using the SQL Editor or Table Editor:

    **`products` table**
    -   `id`: `uuid`, Primary Key, `default: gen_random_uuid()`
    -   `created_at`: `timestamp with time zone`, `default: now()`
    -   `name`: `text`, `not null`
    -   `description`: `text`
    -   `price`: `numeric`, `not null`
    -   `image_url`: `text`
    -   `user_id`: `uuid`, `references auth.users(id)`

    **`cart_items` table**
    -   `id`: `uuid`, Primary Key, `default: gen_random_uuid()`
    -   `created_at`: `timestamp with time zone`, `default: now()`
    -   `user_id`: `uuid`, `not null`, `references auth.users(id)`
    -   `product_id`: `uuid`, `not null`, `references products(id)`
    -   `quantity`: `integer`, `not null`, `default: 1`

    **`orders` table**
    -   `id`: `uuid`, Primary Key, `default: gen_random_uuid()`
    -   `created_at`: `timestamp with time zone`, `default: now()`
    -   `user_id`: `uuid`, `not null`, `references auth.users(id)`
    -   `total_amount`: `numeric`, `not null`
    -   `status`: `text`, `default: 'pending'`
    -   `payment_method`: `text`
    -   `order_name`: `text`
    -   `payment_key`: `text`

    **`order_items` table**
    -   `id`: `uuid`, Primary Key, `default: gen_random_uuid()`
    -   `created_at`: `timestamp with time zone`, `default: now()`
    -   `order_id`: `uuid`, `not null`, `references orders(id)`
    -   `product_id`: `uuid`, `not null`, `references products(id)`
    -   `quantity`: `integer`, `not null`
    -   `price_at_purchase`: `numeric`, `not null`

### 4. Environment Variables

Create a `.env.local` file in the root of your project and add the following:

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_TOSS_CLIENT_KEY=YOUR_TOSS_PAYMENTS_CLIENT_KEY
TOSS_SECRET_KEY=YOUR_TOSS_PAYMENTS_SECRET_KEY
```

-   Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with your Supabase project details.
-   Replace `YOUR_TOSS_PAYMENTS_CLIENT_KEY` and `YOUR_TOSS_PAYMENTS_SECRET_KEY` with your Toss Payments test or live keys.

### 5. Row Level Security (RLS) Policies

**It is crucial to enable RLS for your `products`, `cart_items`, `orders`, and `order_items` tables and set up appropriate policies.** Disabling RLS is a security risk. Here are the recommended policies:

**`products` table policies:**
-   **Allow public read access (SELECT)**: `FOR: SELECT`, `USING: true`, `Target roles: anon, authenticated`
-   **Allow owner to insert their own product (INSERT)**: `FOR: INSERT`, `WITH CHECK: auth.uid() = user_id`, `Target roles: authenticated`
-   **Allow owner to update their own product (UPDATE)**: `FOR: UPDATE`, `USING: auth.uid() = user_id`, `WITH CHECK: auth.uid() = user_id`, `Target roles: authenticated`
-   **Allow owner to delete their own product (DELETE)**: `FOR: DELETE`, `USING: auth.uid() = user_id`, `Target roles: authenticated`

**`cart_items` table policies:**
-   **Allow owner to read their own cart items (SELECT)**: `FOR: SELECT`, `USING: auth.uid() = user_id`, `Target roles: authenticated`
-   **Allow owner to insert their own cart item (INSERT)**: `FOR: INSERT`, `WITH CHECK: auth.uid() = user_id`, `Target roles: authenticated`
-   **Allow owner to update their own cart item (UPDATE)**: `FOR: UPDATE`, `USING: auth.uid() = user_id`, `WITH CHECK: auth.uid() = user_id`, `Target roles: authenticated`
-   **Allow owner to delete their own cart item (DELETE)**: `FOR: DELETE`, `USING: auth.uid() = user_id`, `Target roles: authenticated`

**`orders` table policies:**
-   **Allow owner to read their own orders (SELECT)**: `FOR: SELECT`, `USING: auth.uid() = user_id`, `Target roles: authenticated`
-   **Allow authenticated user to create their own order (INSERT)**: `FOR: INSERT`, `WITH CHECK: auth.uid() = user_id`, `Target roles: authenticated`

**`order_items` table policies:**
-   **Allow owner to read their own order items (SELECT)**: `FOR: SELECT`, `USING: auth.uid() = (SELECT user_id FROM orders WHERE id = order_id)`, `Target roles: authenticated`
-   **Allow authenticated user to insert order items (INSERT)**: `FOR: INSERT`, `WITH CHECK: auth.uid() = (SELECT user_id FROM orders WHERE id = order_id)`, `Target roles: authenticated`

### 6. Enable Email Authentication in Supabase

-   Go to **Authentication** -> **Providers** in your Supabase project.
-   Ensure **Email** provider is enabled.

## Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Pages/Routes

-   `/`: Home page with product listing.
-   `/login`: User login and signup.
-   `/products`: Product management (add/list products).
-   `/products/[id]`: Product detail page.
-   `/cart`: Shopping cart.
-   `/orders`: User's order history.
-   `/payment/success`: Toss Payments success redirect page.
-   `/payment/fail`: Toss Payments failure redirect page.

## API Route Authentication

All server-side authentication in API Route Handlers (`src/app/api/...`) should use the `@supabase/ssr` library, which is the recommended approach for the Next.js App Router.

It is critical to create the Supabase client **directly** within each route handler that requires it. Do not use a shared helper function to create the client, as this can conflict with Next.js's dynamic rendering and cause authentication to fail.

**Correct Pattern:**

```typescript
// In an API Route file (e.g., /api/cart/route.ts)
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.delete(name, options);
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... rest of your logic
}
```