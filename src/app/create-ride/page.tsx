'use client'

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import { toast } from "sonner";
import { User, AssociatedPerson } from "@/types";
import { fetchUserData } from "@/utils/api";
import { useOnlineStatus } from "@/utils/useOnlineStatus";
import { TutorialProvider } from '@/contexts/TutorialContext'
import { Loader } from 'lucide-react';

const CreateRidePage = dynamic(() => import('@/components/CreateRidePage'), { ssr: false });

export default function CreateRide() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [etag, setEtag] = useState<string | null>(null);

  const router = useRouter();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem("currentUser");
      if (user) {
        const parsedUser = JSON.parse(user) as User;
        setCurrentUser(parsedUser);
        void fetchUserDataCallback(parsedUser.id);
      } else {
        router.push('/');
      }
    }
  }, [router]);

  const fetchUserDataCallback = async (userId: string) => {
    if (isOnline) {
      try {
        const result = await fetchUserData(userId, etag);
        if (result) {
          const { data, newEtag } = result;
          setEtag(newEtag);
          setAssociatedPeople(data.associatedPeople);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user data. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (currentUser) {
      const intervalId = setInterval(() => {
        void fetchUserDataCallback(currentUser.id);
      }, 10000);
      return () => clearInterval(intervalId);
    }
  }, [currentUser, isOnline]);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("currentUser");
    }
    router.push('/');
  };

  return (
    <TutorialProvider>
      <Layout currentUser={currentUser} logout={logout}>
        <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
          {currentUser && (
            <CreateRidePage
              currentUser={currentUser}
              fetchUserData={() => fetchUserDataCallback(currentUser.id)}
              setCurrentPage={(page) => router.push(`/${page}`)}
              associatedPeople={associatedPeople}
            />
          )}
        </Suspense>
      </Layout>
    </TutorialProvider>
  );
}

