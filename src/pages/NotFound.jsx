import { Link } from "react-router-dom"
import { useTitle } from "../useTitle"

export default function NotFound() {
  useTitle("Not found")
  return (
    <section className="text-hero not-found">
      <p className="kicker">404</p>
      <h1>This room has not been composed.</h1>
      <Link to="/" className="btn">
        Return home
      </Link>
    </section>
  )
}
