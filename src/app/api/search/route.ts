import { NextRequest, NextResponse } from 'next/server';
import photosData from '../../../../data/photos.json';
import { retrievePhotos } from '../../../lib/search-engine';
import { PhotoItem, StructuredClues } from '../../../lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, clues } = body as { query?: string; clues?: StructuredClues };

    if (!query && !clues) {
      return NextResponse.json({ error: 'Query string or clues are required' }, { status: 400 });
    }

    const photos = photosData as PhotoItem[];
    const result = retrievePhotos(query || '', photos, clues);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Search execution failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
