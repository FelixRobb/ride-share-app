import RegisterPage from "@/components/RegisterPage";
import { getRandomQuote } from "@/utils/authUtils";

export default function Register() {
  const randomQuote = getRandomQuote();

  return <RegisterPage quote={randomQuote} />;
}
