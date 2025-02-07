# RideShare

RideShare is a modern, user-friendly web application that facilitates ride-sharing among users. It allows people to connect, offer, and request rides within their trusted network of contacts.

![RideShare Logo](/public/icon.svg)

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- User authentication and registration
- Create, edit, and manage ride requests
- Offer rides to other users
- Real-time notifications for ride updates
- User profile management
- Contact list and suggestions
- Interactive map for location selection
- Responsive design for mobile and desktop
- Dark mode support
- Offline capabilities
- Push notifications (on supported browsers)

## Technologies Used

- [Next.js 13](https://nextjs.org/) with App Router
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.io/) for database and authentication
- [MapTiler](https://www.maptiler.com/) for map services
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Lucide React](https://lucide.dev/) for icons
- [next-themes](https://github.com/pacocoursey/next-themes) for theming
- [Vercel](https://vercel.com/) for deployment

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Supabase account
- MapTiler API key
- Vercel account (for deployment)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/rideshare.git
   cd rideshare
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_MAPTILER_KEY=your_maptiler_api_key
   JWT_SECRET=your_jwt_secret
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Register for an account or log in if you already have one.
2. Set up your profile and add contacts.
3. Create a ride request by specifying the start and end locations, date, and time.
4. Browse available rides and offer rides to others.
5. Manage your rides from the dashboard.
6. Receive notifications for ride updates and new requests.

## Project Structure

- `app/`: Next.js 13 app directory containing page components and API routes
- `components/`: Reusable React components
- `contexts/`: React context providers
- `hooks/`: Custom React hooks
- `lib/`: Utility functions and configuration files
- `public/`: Static assets
- `styles/`: Global styles and Tailwind CSS configuration
- `types/`: TypeScript type definitions
- `utils/`: Helper functions and API calls

## API Endpoints

- `/api/login`: User login
- `/api/register`: User registration
- `/api/user`: Get current user data
- `/api/rides`: CRUD operations for rides
- `/api/contacts`: Manage user contacts
- `/api/notifications`: Handle user notifications
- `/api/users`: User-related operations

For a complete list of API endpoints and their usage, please refer to the API documentation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

Félix Robb - [rideshareapp.mail@gmail.com](rideshareapp.mail@gmail.com)

Project Link: [https://github.com/FelixRobb/ride-share-app/](https://github.com/FelixRobb/ride-share-app/)

