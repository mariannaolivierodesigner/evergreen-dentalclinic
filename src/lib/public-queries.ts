import { queryOptions } from "@tanstack/react-query";
import {
  getPost,
  getService,
  listDoctors,
  listPosts,
  listServices,
  listTestimonials,
} from "./public.functions";

export const servicesQuery = () =>
  queryOptions({ queryKey: ["services"], queryFn: () => listServices() });

export const serviceQuery = (slug: string) =>
  queryOptions({ queryKey: ["service", slug], queryFn: () => getService({ data: { slug } }) });

export const doctorsQuery = () =>
  queryOptions({ queryKey: ["doctors"], queryFn: () => listDoctors() });

export const testimonialsQuery = () =>
  queryOptions({ queryKey: ["testimonials"], queryFn: () => listTestimonials() });

export const postsQuery = () => queryOptions({ queryKey: ["posts"], queryFn: () => listPosts() });

export const postQuery = (slug: string) =>
  queryOptions({ queryKey: ["post", slug], queryFn: () => getPost({ data: { slug } }) });