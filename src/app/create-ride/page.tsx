'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateRidePage from '@/components/CreateRidePage';
import Layout from '@/components/Layout';
import { useToast } from "@/hooks/use-toast";
import { User, AssociatedPerson } from "@/types";
import { Loader } from 'lucide-react';
import { fetchUserData } from "@/utils/api";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

export default function CreateRide() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout currentUser={currentUser} logout={logout}>
      <CreateRidePage
        currentUser={currentUser!}
        fetchUserData={() => fetchUserDataCallback(currentUser!.id)}
        setCurrentPage={(page) => router.push(`/${page}`)}
        associatedPeople={associatedPeople}
      />
    </Layout>
  );
}

