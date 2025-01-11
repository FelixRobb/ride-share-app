'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import { useToast } from "@/hooks/use-toast";
import { User, AssociatedPerson } from "@/types";
import { useOnlineStatus } from "@/utils/useOnlineStatus";
import { TutorialProvider } from '@/contexts/TutorialContext'
import { fetchUserData } from "@/utils/api";

const CreateRidePage = dynamic(() => import('@/components/CreateRidePage'), { ssr: false });

export default function CreateRide() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([]);
  const [etag, setEtag] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();
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
        //setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch user data. Please try again.",
          variant: "destructive",
        });
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
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <TutorialProvider>
        <Layout currentUser={currentUser} logout={logout}>
          {currentUser && (
            <CreateRidePage
              currentUser={currentUser}
              fetchUserData={() => fetchUserDataCallback(currentUser.id)}
              setCurrentPage={(page) => router.push(`/${page}`)}
              associatedPeople={associatedPeople}
            />
          )}
        </Layout>
      </TutorialProvider>
    </Suspense>
  );
}

