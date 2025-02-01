'use client'

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { toast } from "sonner";

import Layout from '@/components/Layout';
import { User, AssociatedPerson } from "@/types";
import { fetchUserData } from "@/utils/api";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

const CreateRidePage = dynamic(() => import('@/components/CreateRidePage'), { ssr: false });

export default function CreateRide() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([]);
  const [etag, setEtag] = useState<string | null>(null);

  const router = useRouter();
  const isOnline = useOnlineStatus();

  const fetchUserDataCallback = useCallback(async (userId: string) => {
    if (isOnline) {
      try {
        const result = await fetchUserData(userId, etag);
        if (result) {
          const { data, newEtag } = result;
          setEtag(newEtag);
          setAssociatedPeople(data.associatedPeople);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user data. Please try again.");
      }
    }
  }, [etag, isOnline]);
  
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
  }, [fetchUserDataCallback, router]);

  useEffect(() => {
    if (currentUser) {
      const intervalId = setInterval(() => {
        void fetchUserDataCallback(currentUser.id);
      }, 10000);
      return () => clearInterval(intervalId);
    }
  }, [currentUser, fetchUserDataCallback, isOnline]);


  return (
    <Layout currentUser={currentUser}>
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
  );
}

