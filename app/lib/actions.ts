'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
const bcrypt = require('bcrypt');

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type InvoiceState = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(
  prevState: InvoiceState,
  formData: FormData,
) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(
  id: string,
  prevState: InvoiceState,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

//Customers actions

const FormCustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(4, {
    message: 'Name must haveat least 4 characters',
  }),
  image_url: z.string().url({
    message: 'Please enter a URL.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
});

const CreateCustomer = FormCustomerSchema.omit({ id: true });

export type CustomerState = {
  errors?: {
    name?: string[];
    image_url?: string[];
    email?: string[];
  };
  message?: string | null;
};

export async function createCustomer(
  prevState: CustomerState,
  formData: FormData,
) {
  noStore();
  // Validate form using Zod
  const validatedFields = CreateCustomer.safeParse({
    image_url: formData.get('image_url'),
    name: formData.get('name'),
    email: formData.get('email'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Customer.',
    };
  }

  // Prepare data for insertion into the database
  const { image_url, name, email } = validatedFields.data;
  // Insert data into the database
  try {
    const res = await sql`
      INSERT INTO customers (image_url, name, email)
      VALUES (${image_url}, ${name}, ${email})
    `;
    console.log({ res, name });
  } catch (error) {
    console.log({ error });

    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Customer.',
    };
  }

  // Revalidate the cache for the customers page and redirect the user.
  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

const UpdateCustomer = FormCustomerSchema.omit({ id: true, image_url: true });

export async function updateCustomer(
  id: string,
  prevState: CustomerState,
  formData: FormData,
) {
  const validatedFields = UpdateCustomer.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Customer.',
    };
  }

  const { name, email } = validatedFields.data;

  try {
    await sql`
      UPDATE customers
      SET name = ${name}, email = ${email}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Customer.' };
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
  try {
    await sql`DELETE FROM customers WHERE id = ${id}`;
    revalidatePath('/dashboard/customers');
    return { message: 'Deleted Customer.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Customer.' };
  }
}

//User actions

const FormUserSchema = z.object({
  id: z.string(),
  name: z.string().min(4, {
    message: 'Name must haveat least 4 characters',
  }),
  password: z
    .string()
    .min(8, {
      message: 'Password must haveat least 8 characters',
    })
    .regex(/[a-z]/, {
      message: 'Password requires at least 1 lowercase character',
    })
    .regex(/[A-Z]/, {
      message: 'Password requires at least 1 uppercase character',
    })
    .regex(/[0-9]/, {
      message: 'Password requires at least 1 digit',
    })
    .regex(/[#?!@$%^&*-]/, {
      message: 'Password requires at least 1 special character (#?!@$%^&*-)',
    }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
});

const CreateNewUser = FormUserSchema.omit({ id: true });

export type UserState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string | null;
};

export async function createNewUser(prevState: UserState, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateNewUser.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create User.',
    };
  }

  // Prepare data for insertion into the database
  const { name, email, password } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert data into the database
  try {
    await sql`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${email}, ${hashedPassword})
    `;
  } catch (error) {
    console.log(error);
    if ((error as any).code === '23505') {
      return {
        message: 'Email already exists',
      };
    }
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create User.',
    };
  }

  // Revalidate the cache for the users page and redirect the user.
  revalidatePath('/login');
  redirect('/login');
}
