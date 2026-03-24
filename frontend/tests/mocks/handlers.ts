import { http, HttpResponse } from 'msw';

// Mock data for fragrances
export const mockFragrances = [
  {
    id: '1',
    name: 'Opium',
    brand: 'Yves Saint Laurent',
    family: 'Floral',
    notes: ['Orange Blossom', 'Jasmine', 'Vanilla'],
    rating: 4.8,
    longevity: 'Long-lasting',
    sillage: 'Strong',
    description: 'A luxurious and opulent fragrance for women.',
    imageUrl: 'https://via.placeholder.com/300x300?text=Opium',
  },
  {
    id: '2',
    name: 'Black Opium',
    brand: 'Yves Saint Laurent',
    family: 'Oriental',
    notes: ['Coffee', 'Vanilla', 'Vanilla Tonka Bean'],
    rating: 4.7,
    longevity: 'Long-lasting',
    sillage: 'Strong',
    description: 'A rich and sensual fragrance with coffee accords.',
    imageUrl: 'https://via.placeholder.com/300x300?text=Black+Opium',
  },
  {
    id: '3',
    name: 'Dior Sauvage',
    brand: 'Christian Dior',
    family: 'Aromatic',
    notes: ['Ambroxan', 'Sauvage Ambroxan', 'Pepper'],
    rating: 4.9,
    longevity: 'Long-lasting',
    sillage: 'Moderate',
    description: 'A classic aromatic fragrance with fresh and spicy notes.',
    imageUrl: 'https://via.placeholder.com/300x300?text=Dior+Sauvage',
  },
];

// Mock user data
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  preferences: {
    favoriteNotes: ['Vanilla', 'Rose', 'Musk'],
    preferredFamilies: ['Floral', 'Oriental'],
    genderNeutral: true,
  },
  wishlist: ['1', '2'],
  quizResponses: {
    sweetness: 7,
    woodiness: 5,
    freshness: 6,
  },
};

// Mock recommendations
export const mockRecommendations = [
  {
    id: '1',
    name: 'Opium',
    brand: 'Yves Saint Laurent',
    matchScore: 0.95,
    reason: 'Matches your preference for floral fragrances with vanilla notes.',
  },
  {
    id: '2',
    name: 'Black Opium',
    brand: 'Yves Saint Laurent',
    matchScore: 0.92,
    reason: 'High vanilla and oriental notes you rated highly.',
  },
  {
    id: '3',
    name: 'Dior Sauvage',
    brand: 'Christian Dior',
    matchScore: 0.88,
    reason: 'Fresh and aromatic profile you indicated interest in.',
  },
];

// Define API handlers
export const handlers = [
  // GET /api/fragrances — List all fragrances
  http.get('/api/fragrances', () => {
    return HttpResponse.json(mockFragrances);
  }),

  // GET /api/fragrances/:id — Get single fragrance
  http.get('/api/fragrances/:id', ({ params }) => {
    const fragrance = mockFragrances.find((f) => f.id === params.id);
    if (!fragrance) {
      return HttpResponse.json(
        { error: 'Fragrance not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json(fragrance);
  }),

  // GET /api/families — Get fragrance families
  http.get('/api/families', () => {
    return HttpResponse.json([
      { id: 'floral', name: 'Floral', description: 'Floral fragrances' },
      { id: 'oriental', name: 'Oriental', description: 'Oriental fragrances' },
      { id: 'aromatic', name: 'Aromatic', description: 'Aromatic fragrances' },
    ]);
  }),

  // POST /api/auth/register — User registration
  http.post('/api/auth/register', async ({ request }) => {
    const bodyText = await request.text();
    let body: any = {};
    
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      // Invalid JSON
    }
    
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    if (body.password.length < 8) {
      return HttpResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      user: {
        id: 'test-user-new-' + Date.now(),
        email: body.email,
        fullName: body.fullName || '',
      },
      token: 'mock-jwt-token-' + Date.now(),
    });
  }),

  // POST /api/auth/login — User login
  http.post('/api/auth/login', async ({ request }) => {
    const bodyText = await request.text();
    let body: any = {};
    
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      // Invalid JSON
    }

    if (!body.email || !body.password) {
      return HttpResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Simulate authentication
    if (body.password !== 'TestPassword123!') {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      user: mockUser,
      token: 'mock-jwt-token-' + Date.now(),
    });
  }),

  // POST /api/auth/logout — User logout
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // GET /api/user/profile — Get user profile
  http.get('/api/user/profile', () => {
    return HttpResponse.json(mockUser);
  }),

  // GET /api/recommendations — Get user recommendations
  http.get('/api/recommendations', () => {
    return HttpResponse.json(mockRecommendations);
  }),

  // POST /api/quiz/submit — Submit quiz responses
  http.post('/api/quiz/submit', async ({ request }) => {
    const bodyText = await request.text();
    let body: any = {};
    
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      // Invalid JSON
    }
    
    return HttpResponse.json({
      success: true,
      recommendations: mockRecommendations,
    });
  }),

  // GET /api/user/wishlist — Get user wishlist
  http.get('/api/user/wishlist', () => {
    return HttpResponse.json({
      wishlist: mockFragrances.filter((f) => mockUser.wishlist.includes(f.id)),
    });
  }),

  // POST /api/user/wishlist/:id — Add to wishlist
  http.post('/api/user/wishlist/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: `Added fragrance ${params.id} to wishlist`,
    });
  }),

  // DELETE /api/user/wishlist/:id — Remove from wishlist
  http.delete('/api/user/wishlist/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: `Removed fragrance ${params.id} from wishlist`,
    });
  }),

  // GET /api/user/profile — Get user profile (for protected routes)
  http.get('/api/user/profile', () => {
    return HttpResponse.json(mockUser);
  }),

  // POST /api/user/profile — Update user profile
  http.post('/api/user/profile', async ({ request }) => {
    const bodyText = await request.text();
    let body: any = {};
    
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      // Invalid JSON
    }
    
    return HttpResponse.json({
      user: {
        ...mockUser,
        ...body,
      },
    });
  }),
];
