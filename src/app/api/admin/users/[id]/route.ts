import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const { name, email, phone } = await request.json()

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ name, email, phone })
      .eq('id', id)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

