'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateRidePage from '@/components/CreateRidePage';
import Layout from '@/components/Layout';
import { useToast } from "@/hooks/use-toast";
import { User, AssociatedPerson } from "@/types";
import { Loader } from 'lucide-react';
import { fetchUserData } from "@/utils/api";

export const dynamic = 'force-dynamic';

export default function CreateRide() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [etag, setEtag] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

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
  };

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