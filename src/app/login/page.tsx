import LoginPage from "@/components/LoginPage";
import { getRandomQuote } from "@/utils/authUtils";

export default function Login() {
  const randomQuote = getRandomQuote();

  return <LoginPage quote={randomQuote} />;
}
