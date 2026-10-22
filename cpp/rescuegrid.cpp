#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;
struct Edge{int to,cost; bool blocked;};
// BFS/DFS: O(V+E). Blocked roads are skipped.
vector<int> bfs(const vector<vector<Edge>>& g,int s){vector<int> seen(g.size()),order;queue<int>q;q.push(s);seen[s]=1;while(!q.empty()){int u=q.front();q.pop();order.push_back(u);for(auto e:g[u])if(!e.blocked&&!seen[e.to])seen[e.to]=1,q.push(e.to);}return order;}
void dfsVisit(const vector<vector<Edge>>&g,int u,vector<int>&seen,vector<int>&order){seen[u]=1;order.push_back(u);for(auto e:g[u])if(!e.blocked&&!seen[e.to])dfsVisit(g,e.to,seen,order);}
// Dijkstra: O((V+E) log V), nonnegative road costs.
vector<int> dijkstra(const vector<vector<Edge>>&g,int s){const int INF=1e9;vector<int>d(g.size(),INF);priority_queue<pair<int,int>,vector<pair<int,int>>,greater<>>pq;d[s]=0;pq.push({0,s});while(!pq.empty()){auto [du,u]=pq.top();pq.pop();if(du!=d[u])continue;for(auto e:g[u])if(!e.blocked&&du+e.cost<d[e.to])d[e.to]=du+e.cost,pq.push({d[e.to],e.to});}return d;}
struct Request{string id;int urgency,people,wait;bool medical;};
bool first(const Request&a,const Request&b){if(a.urgency!=b.urgency)return a.urgency<b.urgency;if(a.medical!=b.medical)return a.medical;if(a.people!=b.people)return a.people>b.people;if(a.wait!=b.wait)return a.wait>b.wait;return a.id<b.id;}
// Merge sort: O(R log R) time, O(R) extra space.
void mergeSort(vector<Request>&a){if(a.size()<2)return;int m=a.size()/2;vector<Request>l(a.begin(),a.begin()+m),r(a.begin()+m,a.end());mergeSort(l);mergeSort(r);int i=0,j=0,k=0;while(i<(int)l.size()&&j<(int)r.size())a[k++]=first(l[i],r[j])?l[i++]:r[j++];while(i<(int)l.size())a[k++]=l[i++];while(j<(int)r.size())a[k++]=r[j++];}
struct Pack{string id;int weight,value;};
// 0/1 Knapsack: O(RW) time and space; pseudo-polynomial in capacity W.
int knapsack(const vector<Pack>&p,int W){vector<vector<int>>dp(p.size()+1,vector<int>(W+1));for(int i=1;i<=int(p.size());i++)for(int w=0;w<=W;w++)dp[i][w]=p[i-1].weight>w?dp[i-1][w]:max(dp[i-1][w],p[i-1].value+dp[i-1][w-p[i-1].weight]);return dp[p.size()][W];}
// Small constrained assignment backtracking, exponential worst case.
bool assign(int i,vector<string>&out,vector<int>&used){vector<vector<int>>ok={{0},{2},{0,1}};if(i==3)return true;for(int t:ok[i])if(!used[t]){used[t]=1;out.push_back("Team "+to_string(t)+" -> request "+to_string(i));if(assign(i+1,out,used))return true;out.pop_back();used[t]=0;}return false;}
int main(){vector<vector<Edge>>g(4);auto add=[&](int a,int b,int c,bool block=false){g[a].push_back({b,c,block});g[b].push_back({a,c,block});};add(0,1,5);add(1,2,3);add(2,3,4);add(0,3,20,true);cout<<"BFS: ";for(int x:bfs(g,0))cout<<x<<' ';cout<<"\nDijkstra cost to 3: "<<dijkstra(g,0)[3]<<"\n";vector<Request>r={{"RQ1",0,40,10,true},{"RQ2",1,20,30,false}};mergeSort(r);cout<<"First priority: "<<r[0].id<<"\nKnapsack value: "<<knapsack({{"A",4,17},{"B",6,14},{"C",8,25}},12)<<"\n";vector<string>out;vector<int>used(3);assign(0,out,used);for(auto&s:out)cout<<s<<"\n";}
